export default defineEventHandler(async (event) => {
  const rec = await requireStore(event)
  const runs = await listRuns(rec.id, 100)
  return runs.map(({ output, ...r }) => ({ ...r, preview: output.replace(/[#*|>`_-]/g, '').slice(0, 180) }))
})
