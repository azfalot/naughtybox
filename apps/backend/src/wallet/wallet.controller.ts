import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { TipCreatorRequest } from '@naughtybox/shared-types';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { WalletService } from './wallet.service';

@UseGuards(AuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  getWallet(@Req() request: AuthenticatedRequest) {
    return this.walletService.getWallet(request.user.id);
  }

  @Post('dev-credit')
  addDevCredit(@Req() request: AuthenticatedRequest) {
    return this.walletService.addDevCredit(request.user.id);
  }

  @Post('tip')
  tipCreator(@Req() request: AuthenticatedRequest, @Body() payload: TipCreatorRequest) {
    return this.walletService.tipCreator(request.user.id, payload);
  }
}
