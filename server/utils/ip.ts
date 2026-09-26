import type { H3Event } from 'h3'

// عنوان العميل خلف البروكسي (Traefik في Coolify أو Vercel):
// البروكسي يضيف العنوان الحقيقي في آخر x-forwarded-for، وأوله ممكن يزوّره العميل.
export function clientIp(event: H3Event) {
  const xff = getHeader(event, 'x-forwarded-for')
  const last = xff?.split(',').map(s => s.trim()).filter(Boolean).at(-1)
  return last || getRequestIP(event) || 'unknown'
}
