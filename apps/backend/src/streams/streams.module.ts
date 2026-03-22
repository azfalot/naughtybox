import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FollowsModule } from '../follows/follows.module';
import { RoomAccessModule } from '../room-access/room-access.module';
import { StreamsController } from './streams.controller';
import { StreamsService } from './streams.service';

@Module({
  imports: [AuthModule, FollowsModule, RoomAccessModule],
  controllers: [StreamsController],
  providers: [StreamsService],
  exports: [StreamsService],
})
export class StreamsModule {}
