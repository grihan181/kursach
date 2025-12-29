FROM node:20-alpine AS builder
WORKDIR /app
ARG NEXT_PUBLIC_BFF_URL=http://localhost:3000/api
ARG NEXT_PUBLIC_CHAT_SOCKET_URL=http://localhost:3000
ARG NEXT_PUBLIC_PAYMENTS_URL=http://localhost:8085
ENV NEXT_PUBLIC_BFF_URL=${NEXT_PUBLIC_BFF_URL}
ENV NEXT_PUBLIC_CHAT_SOCKET_URL=${NEXT_PUBLIC_CHAT_SOCKET_URL}
ENV NEXT_PUBLIC_PAYMENTS_URL=${NEXT_PUBLIC_PAYMENTS_URL}
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_PUBLIC_BFF_URL=${NEXT_PUBLIC_BFF_URL}
ENV NEXT_PUBLIC_CHAT_SOCKET_URL=${NEXT_PUBLIC_CHAT_SOCKET_URL}
ENV NEXT_PUBLIC_PAYMENTS_URL=${NEXT_PUBLIC_PAYMENTS_URL}
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json* ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 8080
CMD ["npm", "start", "--", "-p", "8080"]
