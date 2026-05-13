import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  getHealth(): { status: string; date: string } {
    return {
      status: 'ok',
      date: new Date().toISOString(),
    };
  }
}
