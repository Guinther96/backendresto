import { Transform } from 'class-transformer';
import { IsString, Length, Matches } from 'class-validator';

export class ConnectPairingCodeDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Length(6, 6)
  @Matches(/^[A-Z0-9]{6}$/)
  code: string;
}
