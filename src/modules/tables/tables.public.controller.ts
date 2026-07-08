import { Body, Controller, Post } from '@nestjs/common';
import { TablesService } from './tables.service';
import { ResolveTableQrDto } from './dto/resolve-table-qr.dto';

@Controller('tables')
export class TablesPublicController {
  constructor(private readonly tablesService: TablesService) {}

  @Post('resolve-qr')
  resolveQr(@Body() dto: ResolveTableQrDto) {
    const qrCode = typeof (dto as any)?.qrCode === 'string'
      ? (dto as any).qrCode
      : typeof (dto as any)?.qr_code === 'string'
        ? (dto as any).qr_code
        : '';
    return this.tablesService.resolveByQr(qrCode);
  }
}
