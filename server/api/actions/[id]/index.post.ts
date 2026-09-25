import { z } from 'zod'

const Body = z.object({ chatId: z.string(), decision: z.enum(['apply', 'reject']) })

// موافقة التاجر أو رفضه لاقتراح المساعد (تعديل منتج / إنشاء كوبون)
export default defineEventHandler(async (event) => {
  const rec = await requireStore(event)
  const { chatId, decision } = await readValidatedBody(event, Body.parse)
  const chat = await loadChat(rec.id, chatId)
  const action = chat.actions[getRouterParam(event, 'id')!]
  if (!action) throw createError({ statusCode: 404, statusMessage: 'الإجراء غير موجود' })
  if (action.status !== 'pending') return action

  if (decision === 'reject') {
    action.status = 'rejected'
    chat.pendingNotes.push(`رفض التاجر الاقتراح ${action.id}`)
  } else {
    try {
      await executeAction(getSallaApi(rec), action)
      action.status = 'applied'
      chat.pendingNotes.push(`طبّق التاجر الاقتراح ${action.id} بنجاح`)
    } catch (e: unknown) {
      action.status = 'failed'
      action.error = (e as { statusMessage?: string })?.statusMessage ?? 'فشل التطبيق'
      chat.pendingNotes.push(`فشل تطبيق الاقتراح ${action.id}: ${action.error}`)
    }
  }
  await storeChat(chat)
  return action
})
