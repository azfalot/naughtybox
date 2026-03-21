import { Controller, Get, Headers, Param } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { StreamsService } from './streams.service';

@Controller('streams')
export class StreamsController {
  constructor(
    private readonly streamsService: StreamsService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  async listStreams(@Headers('authorization') authorization?: string) {
    return this.streamsService.listStreams(await this.resolveViewerId(authorization));
  }

  @Get('meta/billing')
  getBillingConfig() {
    return this.streamsService.getBillingConfig();
  }

  @Get(':slug')
  async getStream(@Param('slug') slug: string, @Headers('authorization') authorization?: string) {
    return this.streamsService.getStream(slug, await this.resolveViewerId(authorization));
  }

  private async resolveViewerId(authorization?: string) {
    if (!authorization?.startsWith('Bearer ')) {
      return null;
    }

    try {
      const user = await this.authService.verifyToken(authorization.slice(7));
      return user.id;
    } catch {
      return null;
    }
  }
}
