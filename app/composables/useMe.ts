import type { MeResponse } from '#shared/types'

export function useMe() {
  return useFetch<MeResponse>('/api/me', { key: 'me', dedupe: 'defer' })
}
