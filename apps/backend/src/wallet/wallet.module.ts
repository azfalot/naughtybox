import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StreamsModule } from '../streams/streams.module';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';

@Module({
  imports: [AuthModule, StreamsModule],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
