import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { UpsertCreatorProfileRequest, UpsertCreatorRoomRequest } from '@naughtybox/shared-types';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { CreatorService } from './creator.service';

@UseGuards(AuthGuard)
@Controller('creator')
export class CreatorController {
  constructor(private readonly creatorService: CreatorService) {}

  @Get('dashboard')
  dashboard(@Req() request: AuthenticatedRequest) {
    return this.creatorService.getDashboard(request.user.id);
  }

  @Put('profile')
  upsertProfile(
    @Req() request: AuthenticatedRequest,
    @Body() payload: UpsertCreatorProfileRequest,
  ) {
    return this.creatorService.upsertProfile(request.user.id, payload);
  }

  @Put('room')
  upsertRoom(@Req() request: AuthenticatedRequest, @Body() payload: UpsertCreatorRoomRequest) {
    return this.creatorService.upsertRoom(request.user.id, payload);
  }
}
