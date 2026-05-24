import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PairingController } from './pairing.controller';
import { PairingService } from './pairing.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret =
          configService.get<string>('KDS_JWT_SECRET') ||
          configService.get<string>('JWT_SECRET');

        if (!secret) {
          throw new Error('KDS_JWT_SECRET or JWT_SECRET is required');
        }

        return { secret };
      },
    }),
  ],
  controllers: [PairingController],
  providers: [PairingService],
})
export class PairingModule {}
