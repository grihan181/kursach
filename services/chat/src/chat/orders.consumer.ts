import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class OrdersEventsConsumer {
  private readonly logger = new Logger(OrdersEventsConsumer.name);

  @EventPattern('orders.events')
  handleOrderEvent(@Payload() message: unknown) {
    this.logger.log(`Received order event: ${JSON.stringify(message)}`);
  }
}
