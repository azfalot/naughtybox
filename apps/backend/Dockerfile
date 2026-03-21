FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY packages/shared-configs/package.json packages/shared-configs/package.json
RUN npm ci

FROM deps AS build
WORKDIR /app
COPY . .
RUN npm run build -w @naughtybox/shared-types
RUN npm run build -w @naughtybox/backend

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/apps/backend/dist ./apps/backend/dist

EXPOSE 3000
CMD ["node", "apps/backend/dist/apps/backend/src/main.js"]
