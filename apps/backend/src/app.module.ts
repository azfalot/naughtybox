import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { CreatorModule } from './creator/creator.module';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health.controller';
import { StreamsModule } from './streams/streams.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [DatabaseModule, UsersModule, AuthModule, StreamsModule, CreatorModule],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
