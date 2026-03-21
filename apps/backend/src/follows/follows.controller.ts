import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { FollowsService } from './follows.service';

@UseGuards(AuthGuard)
@Controller('follows')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Get()
  listFollowing(@Req() request: AuthenticatedRequest) {
    return this.followsService.listFollowing(request.user.id);
  }

  @Post(':slug/toggle')
  toggle(@Req() request: AuthenticatedRequest, @Param('slug') slug: string) {
    return this.followsService.toggleFollow(request.user.id, slug);
  }
}
