import type { DataKey, RunRecord } from '#shared/types'

// كل بطاقة تقرأ ملخص بيانات المتجر كامل
const STORE_DATA: DataKey[] = ['store', 'products', 'orders', 'customers', 'carts', 'reviews', 'coupons']

// يشغّل بطاقة مهارة على بيانات المتجر ويبث الناتج نصًا مباشرًا
export default defineEventHandler(async (event) => {
  const rec = await requireStore(event)
  const skill = getSkill(getRouterParam(event, 'slug')!)
  if (!skill) throw createError({ statusCode: 404, statusMessage: 'المهارة غير موجودة' })
  await assertQuota(rec)

  const body = (await readBody<{ request?: string }>(event)) ?? {}
  const request = String(body.request ?? '').slice(0, 4000)

  const api = getSallaApi(rec)
  const [context, system] = await Promise.all([buildStoreContext(api, STORE_DATA), skillSystem(skill)])
  const model = aiModel()

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
          max_tokens: 64000,
          thinking: { type: 'adaptive' },
          output_config: { effort: 'high' },
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
        run.usage = { input: final.usage.input_tokens, output: final.usage.output_tokens }
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
