import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';

@Controller('auth/telegram')
export class AuthController {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  @Post('start')
  async start() {
    const token = randomUUID();

    await this.prisma.telegramLogin.create({
      data: {
        token,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    return {
      token,
      url: `https://t.me/NotFatherNotification_Bot?start=login_${token}`,
    };
  }

  @Post('confirm')
  async confirm(
    @Body()
    body: {
      token: string;
      telegramId: string;
      username?: string;
    },
  ) {
    const login = await this.prisma.telegramLogin.findUnique({
      where: { token: body.token },
    });

    if (!login) throw new UnauthorizedException();
    if (login.used) throw new UnauthorizedException();
    if (login.expiresAt < new Date()) throw new UnauthorizedException();

    await this.prisma.telegramLogin.update({
      where: { token: body.token },
      data: {
        telegramId: body.telegramId,
        used: true,
      },
    });

    return { ok: true };
  }

  @Get('status/:token')
  async status(@Param('token') token: string) {
    const login = await this.prisma.telegramLogin.findUnique({
      where: { token },
    });

    if (!login) return { status: 'invalid' };

    if (login.expiresAt < new Date()) {
      return { status: 'expired' };
    }

    if (!login.telegramId) {
      return { status: 'pending' };
    }

    const user = await this.prisma.user.upsert({
      where: { telegramId: login.telegramId },
      update: {},
      create: {
        telegramId: login.telegramId,
      },
    });

    const jwt = this.jwt.sign({
      userId: user.id,
    });

    return {
      status: 'success',
      token: jwt,
    };
  }
}
