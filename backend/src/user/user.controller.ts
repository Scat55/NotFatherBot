import {
  Controller,
  Get,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Controller('users')
export class UsersController {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  @Get('me')
  async me(@Headers('authorization') auth: string) {
    if (!auth) {
      throw new UnauthorizedException('No Authorization header');
    }

    const token = auth.replace('Bearer ', '').trim();

    let payload: any;
    try {
      payload = this.jwt.verify(token);
    } catch (e) {
      throw new UnauthorizedException('Invalid token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      telegramId: user.telegramId,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      photoUrl: user.photoUrl,
    };
  }
}
