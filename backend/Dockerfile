FROM node:22-alpine AS backend-build

WORKDIR /app

COPY ./package*.json ./
RUN npm ci

COPY ./src/prisma ./src/prisma
COPY ./prisma.config.ts ./tsconfig.json ./
RUN npx prisma generate

COPY . ./
RUN npm run compile

FROM node:22-alpine AS backend-runtime

WORKDIR /app

COPY --from=backend-build /app/dist ./dist
COPY --from=backend-build /app/node_modules ./node_modules
COPY --from=backend-build /app/src/prisma ./src/prisma

STOPSIGNAL SIGKILL
CMD ["node", "dist/index.js"]

EXPOSE 3000
