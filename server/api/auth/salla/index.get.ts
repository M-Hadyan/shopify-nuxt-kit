import { randomBytes } from 'node:crypto'

// بداية تسجيل الدخول عبر سلة (OAuth)
export default defineEventHandler(async (event) => {
  const state = randomBytes(16).toString('hex')
  setCookie(event, 'rawaj_oauth_state', state, { httpOnly: true, sameSite: 'lax', secure: !import.meta.dev, maxAge: 600, path: '/' })
  return sendRedirect(event, sallaAuthorizeUrl(state))
})
