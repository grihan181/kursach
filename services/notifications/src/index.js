import express from 'express';
import morgan from 'morgan';
import axios from 'axios';
import { Kafka, logLevel } from 'kafkajs';
import nodemailer from 'nodemailer';

const PORT = Number(process.env.PORT || 8080);
const brokers = process.env.KAFKA_BROKERS?.split(',').filter(Boolean) || ['kafka:9092'];
const consumeTopics =
  process.env.NOTIFICATIONS_CONSUME_TOPICS?.split(',').filter(Boolean) || ['chat.notifications'];
const outboundTopic = process.env.NOTIFICATIONS_OUTBOUND_TOPIC || 'notifications.outbound';
const webhookUrl = process.env.NOTIFICATIONS_WEBHOOK_URL;
const clientId = process.env.KAFKA_CLIENT_ID || 'notifications-service';
const groupId = process.env.KAFKA_GROUP_ID || 'notifications-consumers';

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpSecure = process.env.SMTP_SECURE === 'true';
const emailFrom = process.env.NOTIFICATIONS_EMAIL_FROM || smtpUser;
const defaultEmailRecipients =
  process.env.NOTIFICATIONS_EMAIL_TO?.split(',').map((item) => item.trim()).filter(Boolean) || [];
const authServiceUrl = process.env.AUTH_SERVICE_URL;
const authInternalToken = process.env.AUTH_INTERNAL_TOKEN;

let mailer = null;
if (smtpHost && emailFrom) {
  mailer = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: smtpUser ? { user: smtpUser, pass: smtpPass } : undefined,
  });
  mailer
    .verify()
    .then(() => console.log('[notifications] SMTP connection verified'))
    .catch((err) => console.warn('[notifications] SMTP verify failed:', err?.message || err));
} else {
  console.warn('[notifications] Email delivery disabled: set SMTP_HOST and NOTIFICATIONS_EMAIL_FROM');
}

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

async function sendStatusEmail(event) {
  const recipients = await resolveRecipients(event);
  if (!mailer || !recipients.length) return;
  const orderId = event.reference ?? event.id ?? '';
  const statusText = event.status ?? 'неизвестно';
  const subject = `Статус ${orderId} - ${statusText}`.trim();
  const lines = [
    `Новый статус: ${statusText}`,
    orderId ? `Заявка: ${orderId}` : null,
    event.reference ? `Ссылка: ${event.reference}` : null,
    event.userId ? `Пользователь: ${event.userId}` : null,
    event.route ? `Маршрут: ${event.route}` : null,
    event.price && event.currency ? `Стоимость: ${event.price} ${event.currency}` : null,
    `Изменено: ${event.changedAt ?? new Date().toISOString()}`,
  ]
    .filter(Boolean)
    .join('\n');

  await mailer.sendMail({
    from: emailFrom,
    to: recipients.join(', '),
    subject,
    text: lines,
  });
  console.log(`Email notification sent for order ${event.id ?? ''} to ${recipients.join(', ')}`);
}

async function sendStageEmail(event) {
  const recipients = await resolveRecipients(event);
  if (!mailer || !recipients.length) return;
  const orderId = event.reference ?? event.id ?? '';
  const subject = `Обновление маршрута ${orderId}`.trim();
  const lines = [
    `Этап: ${event.title ?? 'без названия'}`,
    event.location ? `Локация: ${event.location}` : null,
    event.note ? `Комментарий: ${event.note}` : null,
    `Добавлено: ${event.happenedAt ?? new Date().toISOString()}`,
  ]
    .filter(Boolean)
    .join('\n');

  await mailer.sendMail({
    from: emailFrom,
    to: recipients.join(', '),
    subject,
    text: lines,
  });
  console.log(`Stage notification sent for order ${event.id ?? ''} to ${recipients.join(', ')}`);
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

      if (topic.includes('order.status') || topic.includes('order-status')) {
        try {
          await sendStatusEmail(value);
        } catch (err) {
          console.error('Failed to send email notification:', err?.message || err);
        }
      } else if (topic.includes('order.stage')) {
        try {
          await sendStageEmail(value);
        } catch (err) {
          console.error('Failed to send stage notification:', err?.message || err);
        }
      }

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

async function resolveUserEmail(userId) {
  if (!authServiceUrl || !authInternalToken || !userId) return null;
  try {
    const response = await axios.get(`${authServiceUrl}/auth/internal/users/${userId}`, {
      headers: { 'X-Internal-Token': authInternalToken },
      timeout: 3000,
    });
    return response.data?.email || null;
  } catch (err) {
    console.warn('Failed to resolve user email via auth service:', err?.message || err);
    return null;
  }
}

function normalizeEmail(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.includes('@') ? trimmed : null;
}

async function resolveRecipients(event) {
  const unique = new Set();
  const push = (value) => {
    const normalized = normalizeEmail(value);
    if (normalized) {
      unique.add(normalized);
    }
  };

  push(event?.userEmail);
  push(event?.email);
  if (Array.isArray(event?.recipients)) {
    event.recipients.filter(Boolean).forEach(push);
  }

  if (event?.userId && !unique.size) {
    const resolved = await resolveUserEmail(event.userId);
    push(resolved);
  }

  defaultEmailRecipients.forEach(push);

  if (!unique.size) {
    console.warn('[notifications] No email recipients resolved for event', event?.id ?? event);
  }

  return Array.from(unique);
}
