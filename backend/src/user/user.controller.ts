import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard, CurrentUser } from '../auth/jwt.guard';

@Controller('users')
export class UsersController {
  constructor(private prisma: PrismaService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: { userId: number }) {
    const found = await this.prisma.user.findUnique({
      where: { id: user.userId },
    });

    // Количество пар
    const pairsCount = await this.prisma.couple.count({
      where: {
        OR: [{ creatorId: found.id }, { partnerId: found.id }],
      },
    });

    // Хотелки из всех пар где пользователь создатель
    const wishlistCount = await this.prisma.wish.count({
      where: {
        couple: { creatorId: found.id },
      },
    });

    // Выполненные задания (где пользователь партнёр)
    const completedTasks = await this.prisma.wish.count({
      where: {
        couple: { partnerId: found.id },
        done: true,
      },
    });

    // Пропущенные и достижения — будут реализованы с геймификацией
    const skippedTasks = 0;
    const achievements = 0;

    return {
      id: found.id,
      telegramId: found.telegramId,
      username: found.username,
      firstName: found.firstName,
      lastName: found.lastName,
      photoUrl: found.photoUrl,
      balance: found.balance,
      createdAt: found.createdAt,
      pairsCount,
      wishlistCount,
      completedTasks,
      skippedTasks,
      achievements,
    };
  }
}
