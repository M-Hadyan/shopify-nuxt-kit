export default defineEventHandler(async event => ({ admin: await requireAdmin(event), configured: adminConfigured() }))
