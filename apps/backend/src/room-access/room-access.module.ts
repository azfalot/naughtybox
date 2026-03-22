import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WalletModule } from '../wallet/wallet.module';
import { RoomAccessController } from './room-access.controller';
import { RoomAccessService } from './room-access.service';

@Module({
  imports: [AuthModule, WalletModule],
  controllers: [RoomAccessController],
  providers: [RoomAccessService],
  exports: [RoomAccessService],
})
export class RoomAccessModule {}
