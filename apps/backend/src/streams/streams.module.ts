import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FollowsModule } from '../follows/follows.module';
import { RoomAccessModule } from '../room-access/room-access.module';
import { StreamSessionsModule } from '../stream-sessions/stream-sessions.module';
import { StreamsController } from './streams.controller';
import { StreamsService } from './streams.service';

@Module({
  imports: [AuthModule, FollowsModule, RoomAccessModule, StreamSessionsModule],
  controllers: [StreamsController],
  providers: [StreamsService],
  exports: [StreamsService],
})
export class StreamsModule {}
