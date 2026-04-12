import { Module } from '@nestjs/common';
import { StreamSessionsService } from './stream-sessions.service';

@Module({
  providers: [StreamSessionsService],
  exports: [StreamSessionsService],
})
export class StreamSessionsModule {}
