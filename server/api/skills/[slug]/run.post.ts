import type { RunRecord } from '#shared/types'

// يشغّل بطاقة مهارة على بيانات المتجر ويبث الناتج نصًا مباشرًا
export default defineEventHandler(async (event) => {
  const rec = await requireStore(event)
  const skill = getSkill(getRouterParam(event, 'slug')!)
  if (!skill) throw createError({ statusCode: 404, statusMessage: 'المهارة غير موجودة' })
  await assertQuota(rec)

  const body = (await readBody<{ inputs?: Record<string, string> }>(event)) ?? {}
  const inputs = Object.fromEntries(
    skill.inputs.map(i => [i.key, String(body.inputs?.[i.key] ?? '').slice(0, 2000)]),
  )
  for (const i of skill.inputs) {
    if (i.required && !inputs[i.key]?.trim()) throw createError({ statusCode: 422, statusMessage: `الحقل «${i.label}» مطلوب` })
  }

  const api = getSallaApi(rec)
  const [context, system] = await Promise.all([buildStoreContext(api, skill.data), skillSystem(skill)])
  const model = aiModel()

  const run: RunRecord = {
    id: newId('run_'), storeId: rec.id, skill: skill.slug, title: skill.title,
    inputs, output: '', status: 'done', createdAt: new Date().toISOString(),
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
          messages: [{ role: 'user', content: skillUserPrompt(skill, context, inputs) }],
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
          const note = '\n\n> تعذر إكمال هذا الطلب. جرّب تعديل المدخلات.'
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
