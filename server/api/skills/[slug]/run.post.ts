import type { DataKey, RunRecord } from '#shared/types'

// كل بطاقة تقرأ ملخص بيانات المتجر كامل
const STORE_DATA: DataKey[] = ['store', 'products', 'orders', 'customers', 'carts', 'reviews', 'coupons']

// يشغّل بطاقة مهارة على بيانات المتجر ويبث الناتج نصًا مباشرًا
export default defineEventHandler(async (event) => {
  const rec = await requireStore(event)
  const skill = getSkill(getRouterParam(event, 'slug')!)
  if (!skill) throw createError({ statusCode: 404, statusMessage: 'المهارة غير موجودة' })
  const plan = await assertCanRun(rec, skill)

  const body = (await readBody<{ request?: string }>(event)) ?? {}
  const request = String(body.request ?? '').slice(0, 4000)

  const api = getSallaApi(rec)
  const [context, system] = await Promise.all([buildStoreContext(api, STORE_DATA), skillSystem(skill)])
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
        console.error('[skill run]', e)
        run.status = 'error'
        const note = `\n\n> ⚠️ ${describeAiError(e)}`
        run.output += note
        controller.enqueue(encoder.encode(note))
      } finally {
        await saveRun(run)
        // نحسب التشغيل على الباقة فقط إذا نجح
        if (run.status === 'done') await incrementUsage(rec.id)
        controller.close()
      }
    },
  })
  return sendStream(event, stream)
})
