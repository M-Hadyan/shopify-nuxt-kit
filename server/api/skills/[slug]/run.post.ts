import type { DataKey, RunRecord } from '#shared/types'

// كل بطاقة تقرأ ملخص بيانات المتجر كامل
const STORE_DATA: DataKey[] = ['store', 'products', 'orders', 'customers', 'carts', 'reviews', 'coupons']

// يشغّل بطاقة مهارة على بيانات المتجر ويبث الناتج نصًا مباشرًا
export default defineEventHandler(async (event) => {
  const rec = await requireStore(event)
  const skill = getSkill(getRouterParam(event, 'slug')!)
  if (!skill) throw createError({ statusCode: 404, statusMessage: 'المهارة غير موجودة' })

  const body = (await readBody<{ request?: string }>(event)) ?? {}
  const request = String(body.request ?? '').slice(0, 4000)

  const { plan, release } = await reserveRun(rec, skill)
  let context: string, system: Awaited<ReturnType<typeof skillSystem>>
  try {
    ;[context, system] = await Promise.all([buildStoreContext(getSallaApi(rec), STORE_DATA), skillSystem(skill)])
  } catch (e) {
    await release(false)
    throw e
  }
  const { model, effort, maxTokens } = pickModel(plan, skill)

  const run: RunRecord = {
    id: newId('run_'), storeId: rec.id, skill: skill.slug, title: skill.title,
    request, output: '', status: 'done', createdAt: new Date().toISOString(),
  }
  setResponseHeaders(event, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-cache',
    'X-Run-Id': run.id,
    'X-Accel-Buffering': 'no',
  })

  const encoder = new TextEncoder()
  const startedAt = Date.now()
  let errorDetail: string | undefined
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const s = anthropic().beta.messages.stream({
          model,
          max_tokens: maxTokens,
          thinking: { type: 'adaptive' },
          output_config: { effort },
          ...fallbackParams(model),
          system,
          messages: [{ role: 'user', content: skillUserPrompt(skill, context, request) }],
        })
        for await (const ev of s) {
          if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta') {
            run.output += ev.delta.text
            controller.enqueue(encoder.encode(ev.delta.text))
          }
        }
        const final = await s.finalMessage()
        const u = final.usage
        run.usage = { input: u.input_tokens, output: u.output_tokens, cacheRead: u.cache_read_input_tokens ?? 0, cacheWrite: u.cache_creation_input_tokens ?? 0 }
        run.model = final.model
        run.costSar = runCostSar(final.model, u)
        if (final.stop_reason === 'max_tokens') {
          const note = '\n\n> وصلت النتيجة للحد الأقصى للطول. اطلب جزء محدد لو تبي تفاصيل أكثر.'
          run.output += note
          controller.enqueue(encoder.encode(note))
        }
        if (final.stop_reason === 'refusal') {
          run.status = 'refused'
          const note = '\n\n> تعذر إكمال هذا الطلب. جرّب صياغة مختلفة.'
          run.output += note
          controller.enqueue(encoder.encode(note))
        }
      } catch (e) {
        run.status = 'error'
        errorDetail = e instanceof Error ? e.message : String(e)
        const note = `\n\n> ⚠️ ${describeAiError(e)}`
        run.output += note
        controller.enqueue(encoder.encode(note))
      } finally {
        await saveRun(run, rec.demo)
        // التشغيل محجوز مسبقًا؛ نرجعه للباقة لو فشل
        await release(run.status === 'done')
        await recordRun(rec, run, Date.now() - startedAt, errorDetail)
        controller.close()
      }
    },
  })
  return sendStream(event, stream)
})

// سجل ومقاييس كل تشغيل
async function recordRun(rec: { id: string; demo: boolean }, run: RunRecord, ms: number, errorDetail?: string) {
  const costMilli = Math.round((run.costSar ?? 0) * 1000)
  const data = { skill: run.skill, model: run.model, ms, tokensIn: run.usage?.input, tokensOut: run.usage?.output, costSar: run.costSar, status: run.status, runId: run.id, demo: rec.demo }
  if (run.status === 'done') {
    await Promise.all([
      metric('runs'),
      metric('cost_milli', costMilli),
      metric('tokens_out', run.usage?.output ?? 0),
      counterIncrBy(storeCostKey(rec.id), costMilli, 40 * 24 * 3600),
      rec.demo ? counterIncrBy(`cost:demo:${monthKey()}`, costMilli, 40 * 24 * 3600) : Promise.resolve(0),
      counterIncr(skillRunsKey(run.skill), 40 * 24 * 3600),
      counterIncrBy(skillCostKey(run.skill), costMilli, 40 * 24 * 3600),
    ])
    await logEvent('info', 'skill.run', `تشغيل «${run.title}» (${(ms / 1000).toFixed(1)} ث)`, { storeId: rec.id, data })
  } else {
    await metric('run_errors')
    await logEvent(run.status === 'refused' ? 'warn' : 'error', run.status === 'refused' ? 'skill.refused' : 'skill.failed', `فشل تشغيل «${run.title}»${errorDetail ? `: ${errorDetail.slice(0, 200)}` : ''}`, { storeId: rec.id, data })
  }
}
