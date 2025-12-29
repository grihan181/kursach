import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ChatService } from './chat.service';

type OrderEventPayload = {
  id?: string;
  reference?: string;
  userId?: string;
  status?: string;
  route?: string | null;
  price?: number | null;
  currency?: string | null;
  createdAt?: string;
  changedAt?: string;
  type?: 'orderCreated' | 'statusChanged';
};

const statusLabels: Record<string, string> = {
  created: 'Создан',
  paid: 'Оплачен',
  shipping: 'В пути',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
};

const localizeStatus = (value?: string) => {
  if (!value) return 'неизвестно';
  return statusLabels[value] ?? value;
};

@Controller()
export class OrdersEventsConsumer {
  private readonly logger = new Logger(OrdersEventsConsumer.name);

  constructor(private readonly chatService: ChatService) {}

  private adminRoom = process.env.ADMIN_ALERT_ROOM ?? 'admin-feed';
  private botSender = process.env.BOT_SENDER ?? 'bot';

  @EventPattern('order.created')
  async handleOrderCreated(@Payload() message: unknown) {
    await this.handleOrderEvent(message, 'orderCreated');
  }

  @EventPattern('order.status.changed')
  async handleStatusChanged(@Payload() message: unknown) {
    await this.handleOrderEvent(message, 'statusChanged');
  }

  private async handleOrderEvent(message: unknown, fallbackType: OrderEventPayload['type']) {
    const payload = this.normalizePayload(message, fallbackType);
    if (!payload?.id) {
      this.logger.warn(`Skip event without order id: ${JSON.stringify(message)}`);
      return;
    }

    try {
      const text =
        payload.type === 'orderCreated'
          ? this.formatCreated(payload)
          : this.formatStatusChanged(payload);

      // В заказный чат
      await this.chatService.createMessage({
        orderId: payload.id,
        sender: this.botSender,
        content: text,
      });

      // В админский канал
      await this.chatService.createMessage({
        orderId: this.adminRoom,
        sender: this.botSender,
        content: `[${payload.reference ?? payload.id}] ${text}`,
      });

      this.logger.log(
        `Bot message created for order ${payload.reference ?? payload.id} type=${payload.type} admin=${this.adminRoom}`,
      );
    } catch (err) {
      this.logger.error('Failed to create bot messages', err);
    }
  }

  private normalizePayload(message: any, fallbackType: OrderEventPayload['type']): OrderEventPayload {
    const raw = message?.value ?? message;
    if (typeof raw === 'string') {
      try {
        return { ...JSON.parse(raw), type: fallbackType };
      } catch (err) {
        this.logger.warn(`Failed to parse event payload: ${raw}`);
        return { type: fallbackType };
      }
    }
    if (typeof raw === 'object' && raw !== null) {
      return { ...raw, type: (raw as any).type ?? fallbackType };
    }
    return { type: fallbackType };
  }

  private formatCreated(payload: OrderEventPayload) {
    const route = payload.route ?? 'маршрут не указан';
    const reference = payload.reference ?? payload.id ?? 'заказ';
    const pricePart =
      payload.price != null
        ? ` Сумма: ${payload.price}${payload.currency ? ' ' + payload.currency : ''}.`
        : '';
    const status = localizeStatus(payload.status);
    return `Создан новый заказ ${reference}. Статус: ${status}. Маршрут: ${route}.${pricePart}`;
  }

  private formatStatusChanged(payload: OrderEventPayload) {
    const reference = payload.reference ?? payload.id ?? 'заказ';
    const status = localizeStatus(payload.status);
    return `Статус ${reference} обновлён на "${status}".`;
  }
}
