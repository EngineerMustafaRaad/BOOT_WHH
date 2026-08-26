FROM node:20-alpine AS backend-builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine AS dashboard-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=backend-builder /app/node_modules ./node_modules
COPY package*.json ./
COPY --from=backend-builder /app/dist ./dist
COPY --from=dashboard-builder /app/frontend/dist ./frontend-dist
COPY prisma ./prisma
EXPOSE 4000
CMD ["node", "dist/server.js"]