FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod ./
RUN go mod download
COPY . .
RUN go build -o /bin/pricing

FROM alpine:3.19
WORKDIR /app
COPY --from=builder /bin/pricing /usr/local/bin/pricing
EXPOSE 8080
ENV PORT=8080
CMD ["pricing"]
