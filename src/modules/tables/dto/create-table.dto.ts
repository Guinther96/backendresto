import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateTableDto {
  @IsOptional()
  @IsUUID()
  restaurant_id?: string;

  @IsInt()
  @Min(1)
  number: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;
}
