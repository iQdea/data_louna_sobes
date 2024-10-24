FROM node:20.12.2-alpine as base_dependencies
ARG CI=true

WORKDIR /app
COPY ../package.json ../package-lock.json ./
RUN npm ci --only=production

FROM base_dependencies as dev_dependencies
ARG CI=true
RUN npm ci && rm -rf ~/.npm

FROM dev_dependencies as source
COPY .. .

FROM source as builder
RUN npm run build

FROM node:20.12.2-alpine as release
RUN addgroup -g 1001 -S nodejs && adduser -S nodeuser -u 1001 && apk update && apk add postgresql-client
WORKDIR /app

COPY --from=base_dependencies /app/package.json ./package.json
COPY --from=base_dependencies /app/package-lock.json ./package-lock.json

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/assets ./assets

USER nodeuser

ENV NODE_ENV production
ENV PORT 3000
EXPOSE $PORT
CMD ["node", "dist/main"]