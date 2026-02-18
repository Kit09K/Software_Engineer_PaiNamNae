# --- Base Stage ---
FROM node:22-alpine AS base
WORKDIR /app
# ลง dependencies ที่จำเป็นสำหรับระบบ (เผื่อต้องใช้ python/make)
RUN apk add --no-cache libc6-compat 

# --- Dependencies ---
FROM base AS deps
COPY package*.json ./
RUN npm install

# --- Development Stage (ใช้ stage นี้ใน docker-compose) ---
FROM base AS dev
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV HOST=0.0.0.0
ENV PORT=3000
ENV NITRO_PORT=3000

# ใช้ CMD เพื่อเริ่ม Dev Server
CMD ["npm", "run", "dev"]

# --- Builder Stage (สำหรับ Production) ---
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build 

# --- Runner Stage (สำหรับ Production) ---
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.output ./.output

ENV HOST=0.0.0.0
ENV PORT=3000
ENV NITRO_PORT=3000

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]