import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { StreamsModule } from './streams/streams.module';

@Module({
  imports: [StreamsModule],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
