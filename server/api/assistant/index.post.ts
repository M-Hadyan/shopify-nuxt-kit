import { z } from 'zod'

const Body = z.object({ chatId: z.string().optional(), message: z.string().min(1).max(4000) })

export default defineEventHandler(async (event) => {
  const rec = await requireStore(event)
  await assertQuota(rec)
  const { chatId, message } = await readValidatedBody(event, Body.parse)
  const chat = chatId ? await loadChat(rec.id, chatId) : newChat(rec.id)
  try {
    await chatTurn(chat, getSallaApi(rec), message)
  } catch (e) {
    console.error('[assistant]', e)
    // نحذف رسالة المستخدم الأخيرة وما بعدها عشان يبقى السجل صالحًا
    const lastUser = chat.messages.findLastIndex(m => m.role === 'user' && typeof m.content === 'string')
    if (lastUser >= 0) chat.messages.splice(lastUser)
    chat.view.pop()
    if (chatId) await storeChat(chat)
    throw createError({ statusCode: 502, statusMessage: describeAiError(e) })
  }
  await incrementUsage(rec.id)
  await storeChat(chat)
  return chatView(chat)
})
