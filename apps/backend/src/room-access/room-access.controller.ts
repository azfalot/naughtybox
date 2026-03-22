import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { RoomAccessService } from './room-access.service';

@Controller('room-access')
export class RoomAccessController {
  constructor(private readonly roomAccessService: RoomAccessService) {}

  @UseGuards(AuthGuard)
  @Post(':slug/private')
  unlockPrivate(@Req() request: AuthenticatedRequest, @Param('slug') slug: string) {
    return this.roomAccessService.unlockPrivate(request.user.id, slug);
  }

  @UseGuards(AuthGuard)
  @Post(':slug/subscribe')
  subscribe(@Req() request: AuthenticatedRequest, @Param('slug') slug: string) {
    return this.roomAccessService.subscribe(request.user.id, slug);
  }

  @Get(':slug')
  getAnonymous(@Param('slug') slug: string) {
    return this.roomAccessService.getViewerAccess(slug, null);
  }
}
