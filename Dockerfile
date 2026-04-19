FROM node:20-slim AS base

RUN apt-get update && apt-get install -y python3 build-essential && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server ./server

ENV NODE_ENV=production
ENV DATA_DIR=/data
ENV PORT=5000

EXPOSE 5000

CMD ["node", "server/index.js"]
