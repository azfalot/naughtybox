import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '@naughtybox/shared-types';
import * as jwt from 'jsonwebtoken';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async register(payload: RegisterRequest): Promise<AuthResponse> {
    if (!payload.email?.trim() || !payload.username?.trim() || !payload.password?.trim()) {
      throw new BadRequestException('Email, username and password are required.');
    }

    const user = await this.usersService.createUser({
      email: payload.email.trim().toLowerCase(),
      username: payload.username.trim().toLowerCase(),
      passwordHash: this.hashPassword(payload.password),
    });

    return {
      token: this.signToken(user),
      user,
    };
  }

  async login(payload: LoginRequest): Promise<AuthResponse> {
    const identifier = payload.emailOrUsername?.trim().toLowerCase();
    const match = identifier ? await this.usersService.findUserWithPassword(identifier) : null;

    if (!match || !this.verifyPassword(payload.password ?? '', match.passwordHash)) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    return {
      token: this.signToken(match.user),
      user: match.user,
    };
  }

  me(userId: string) {
    return this.usersService.findById(userId);
  }

  async verifyToken(token: string) {
    try {
      const payload = jwt.verify(token, this.jwtSecret()) as { sub: string; role: string };
      return {
        id: payload.sub,
        role: payload.role,
      };
    } catch {
      throw new UnauthorizedException('Invalid token.');
    }
  }

  private signToken(user: User) {
    return jwt.sign(
      {
        sub: user.id,
        role: user.role,
      },
      this.jwtSecret(),
      { expiresIn: '7d' },
    );
  }

  private hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  private verifyPassword(password: string, storedValue: string) {
    const [salt, storedHash] = storedValue.split(':');
    if (!salt || !storedHash) {
      return false;
    }

    const derived = scryptSync(password, salt, 64);
    const original = Buffer.from(storedHash, 'hex');
    return derived.length === original.length && timingSafeEqual(derived, original);
  }

  private jwtSecret() {
    return process.env.JWT_SECRET ?? 'naughtybox-dev-secret';
  }
}
