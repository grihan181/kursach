FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

ENV APP_SERVICE_NAME=order-service
ENV APP_DATABASE_URL=postgresql://order:order@db:5432/orders
ENV APP_KAFKA_BOOTSTRAP_SERVERS=kafka:9092

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
