FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
COPY apps/frontend/package.json apps/frontend/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY packages/shared-configs/package.json packages/shared-configs/package.json
RUN npm ci

FROM deps AS build
WORKDIR /app
COPY . .
RUN npm run build -w @naughtybox/shared-types
RUN npm run build -w @naughtybox/frontend

FROM nginx:1.27-alpine AS runtime
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/frontend/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80
