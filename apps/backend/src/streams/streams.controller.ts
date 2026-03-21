import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateStreamRequest } from '@naughtybox/shared-types';
import { StreamsService } from './streams.service';

@Controller('streams')
export class StreamsController {
  constructor(private readonly streamsService: StreamsService) {}

  @Get()
  listStreams() {
    return this.streamsService.listStreams();
  }

  @Get(':slug')
  getStream(@Param('slug') slug: string) {
    return this.streamsService.getStream(slug);
  }

  @Post()
  createStream(@Body() payload: CreateStreamRequest) {
    return this.streamsService.createStream(payload);
  }
}
