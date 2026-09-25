# ---------- البناء ----------
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npx nuxt build

# ---------- التشغيل ----------
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    NITRO_PRESET=node-server
COPY --from=build /app/.output ./.output
# البيانات (لو ما فيه Redis) تنحفظ هنا: اربطه بـ Volume دائم في Coolify
RUN mkdir -p /app/.data && chown -R node:node /app
USER node
VOLUME ["/app/.data"]
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node", ".output/server/index.mjs"]
