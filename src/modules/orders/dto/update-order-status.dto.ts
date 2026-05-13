import { IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { OrderStatus } from '../enums/order-status.enum';

const FRENCH_TO_STATUS: Record<string, OrderStatus> = {
  EN_ATTENTE: OrderStatus.PENDING,
  EN_PREPARATION: OrderStatus.PREPARING,
  PRET: OrderStatus.READY,
  PRÊT: OrderStatus.READY,
  LIVRE: OrderStatus.DELIVERED,
  LIVRÉ: OrderStatus.DELIVERED,
  SERVED: OrderStatus.DELIVERED,
  ANNULE: OrderStatus.CANCELLED,
  ANNULÉ: OrderStatus.CANCELLED,
};

export class UpdateOrderStatusDto {
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const normalized = value.trim().toUpperCase();
    return FRENCH_TO_STATUS[normalized] ?? normalized;
  })
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}
