import { IsInt, IsUUID, Min } from 'class-validator';

export class CreateOrderItemDto {
  @IsUUID()
  menu_item_id: string;

  @IsInt()
  @Min(1)
  quantity: number;
}
