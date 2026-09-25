import type { ChatView } from '#shared/types'
import type { ChatRecord } from './assistant'

export async function loadChat(storeId: string, chatId: string) {
  const c = await getJson<ChatRecord>(`chats:${storeId}:${chatId}`)
  if (!c) throw createError({ statusCode: 404, statusMessage: 'المحادثة غير موجودة' })
  return c
}

export async function storeChat(c: ChatRecord) {
  await setJson(`chats:${c.storeId}:${c.id}`, c)
}

// يعرض المحادثة مع آخر حالة لكل إجراء
export function chatView(c: ChatRecord): ChatView {
  return {
    id: c.id,
    messages: c.view.map(m => ({ ...m, actions: m.actions?.map(a => c.actions[a.id] ?? a) })),
  }
}
