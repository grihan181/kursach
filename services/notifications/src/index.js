import express from 'express';
import morgan from 'morgan';
import axios from 'axios';
import { Kafka, logLevel } from 'kafkajs';

const PORT = Number(process.env.PORT || 8080);
const brokers = process.env.KAFKA_BROKERS?.split(',').filter(Boolean) || ['kafka:9092'];
const consumeTopics =
  process.env.NOTIFICATIONS_CONSUME_TOPICS?.split(',').filter(Boolean) || ['chat.notifications'];
const outboundTopic = process.env.NOTIFICATIONS_OUTBOUND_TOPIC || 'notifications.outbound';
const webhookUrl = process.env.NOTIFICATIONS_WEBHOOK_URL;
const clientId = process.env.KAFKA_CLIENT_ID || 'notifications-service';
const groupId = process.env.KAFKA_GROUP_ID || 'notifications-consumers';

const app = express();
app.use(express.json());
app.use(morgan('combined'));

const kafka = new Kafka({
  clientId,
  brokers,
  logLevel: logLevel.INFO,
});
const consumer = kafka.consumer({ groupId });
const producer = kafka.producer();

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok', topics: consumeTopics, outboundTopic });
});

async function forwardWebhook(payload) {
  if (!webhookUrl) return;
  try {
    await axios.post(webhookUrl, payload, { timeout: 3000 });
  } catch (err) {
    console.error('Webhook delivery failed:', err?.message || err);
  }
}

async function startKafka() {
  await consumer.connect();
  await producer.connect();
  for (const topic of consumeTopics) {
    await consumer.subscribe({ topic, fromBeginning: false });
  }

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      let value;
      try {
        value = message.value ? JSON.parse(message.value.toString()) : {};
      } catch (err) {
        console.error('Failed to parse message value', err);
        return;
      }
      const payload = {
        id: value.id || message.key?.toString() || Date.now().toString(),
        type: 'notification',
        sourceTopic: topic,
        data: value,
        createdAt: value.createdAt || new Date().toISOString(),
      };

      // Publish outbound event
      try {
        await producer.send({
          topic: outboundTopic,
          messages: [{ key: payload.id, value: JSON.stringify(payload) }],
        });
      } catch (err) {
        console.error('Failed to publish outbound notification', err);
      }

      // Fire optional webhook
      await forwardWebhook(payload);
      console.log(`Processed notification from ${topic}:`, payload.id);
    },
  });
}

async function main() {
  await startKafka();
  app.listen(PORT, () => {
    console.log(`Notifications service listening on ${PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start notifications service', err);
  process.exit(1);
});
