import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StreamsModule } from '../streams/streams.module';
import { UsersModule } from '../users/users.module';
import { CreatorController } from './creator.controller';
import { CreatorService } from './creator.service';

@Module({
  imports: [AuthModule, UsersModule, StreamsModule],
  controllers: [CreatorController],
  providers: [CreatorService],
})
export class CreatorModule {}
