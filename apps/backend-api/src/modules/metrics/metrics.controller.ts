import { Controller, Get, Res } from '@nestjs/common'; // ✅ Res decorator
import { Response } from 'express'; // ✅ Express Response type
import * as client from 'prom-client';

  
@Controller('metrics')
export class MetricsController {
  @Get()
  async getMetrics(@Res() res: Response) {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  }
}