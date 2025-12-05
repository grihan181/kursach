import { Controller, Get } from '@nestjs/common';
import { collectDefaultMetrics, register } from 'prom-client';

collectDefaultMetrics();

@Controller()
export class HealthController {
  @Get('/health')
  health() {
    return { status: 'ok' };
  }

  @Get('/metrics')
  async metrics() {
    return register.metrics();
  }
}
