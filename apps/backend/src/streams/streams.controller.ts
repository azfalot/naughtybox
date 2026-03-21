import { Controller, Get, Param } from '@nestjs/common';
import { StreamsService } from './streams.service';

@Controller('streams')
export class StreamsController {
  constructor(private readonly streamsService: StreamsService) {}

  @Get()
  listStreams() {
    return this.streamsService.listStreams();
  }

  @Get('meta/billing')
  getBillingConfig() {
    return this.streamsService.getBillingConfig();
  }

  @Get(':slug')
  getStream(@Param('slug') slug: string) {
    return this.streamsService.getStream(slug);
  }
}
