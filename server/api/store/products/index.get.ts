export default defineEventHandler(async (event) => {
  const rec = await requireStore(event)
  const { q, page } = getQuery(event) as { q?: string; page?: string }
  return getSallaApi(rec).listProducts({ search: q, page: page ? Number(page) : 1, perPage: 50 })
})
