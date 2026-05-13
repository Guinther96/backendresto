import { IsUUID } from 'class-validator';

export class GeneratePairingCodeDto {
  @IsUUID('4')
  restaurantId: string;
}
