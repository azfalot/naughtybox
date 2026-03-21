import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { LoginRequest, RegisterRequest } from '@naughtybox/shared-types';
import { AuthGuard, AuthenticatedRequest } from './auth.guard';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() payload: RegisterRequest) {
    return this.authService.register(payload);
  }

  @Post('login')
  login(@Body() payload: LoginRequest) {
    return this.authService.login(payload);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  me(@Req() request: AuthenticatedRequest) {
    return this.authService.me(request.user.id);
  }
}
