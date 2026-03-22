import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { CreatorModule } from './creator/creator.module';
import { DatabaseModule } from './database/database.module';
import { FollowsModule } from './follows/follows.module';
import { HealthController } from './health.controller';
import { RoomAccessModule } from './room-access/room-access.module';
import { StreamsModule } from './streams/streams.module';
import { UsersModule } from './users/users.module';
import { WalletModule } from './wallet/wallet.module';

@Module({
  imports: [DatabaseModule, UsersModule, AuthModule, StreamsModule, CreatorModule, WalletModule, ChatModule, FollowsModule, RoomAccessModule],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
