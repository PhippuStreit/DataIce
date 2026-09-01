FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y openssl ca-certificates wget \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate && npm run build

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push --skip-generate && npm start -- --hostname 0.0.0.0"]
