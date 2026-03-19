import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { PrismaService } from '../prisma/prisma.service';

type WishesPayload = {
  token: string;
  wishes: string[];
};

@Controller('api')
export class BotController {
  constructor(
    private readonly prisma: PrismaService,
    @InjectBot() private readonly bot: Telegraf,
  ) {}

  @Post('wishes')
  async updateWishesFromWeb(@Body() body: WishesPayload) {
    const { token, wishes } = body;

    if (!token || !Array.isArray(wishes)) {
      throw new HttpException('Invalid payload', HttpStatus.BAD_REQUEST);
    }

    const user = await this.prisma.user.findUnique({
      where: { webToken: token },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.UNAUTHORIZED);
    }

    const couple = await this.prisma.couple.findFirst({
      where: {
        OR: [{ girlId: user.id }, { boyId: user.id }],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!couple) {
      throw new HttpException('No couple for user', HttpStatus.BAD_REQUEST);
    }

    let cycle = await this.prisma.cycle.findFirst({
      where: { coupleId: couple.id },
      orderBy: { startDate: 'desc' },
    });

    if (!cycle) {
      cycle = await this.prisma.cycle.create({
        data: {
          coupleId: couple.id,
          startDate: new Date(),
          cycleLength: 28,
        },
      });
    }

    await this.prisma.wish.deleteMany({
      where: { cycleId: cycle.id },
    });

    const cleanedWishes = wishes
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    if (cleanedWishes.length) {
      await this.prisma.wish.createMany({
        data: cleanedWishes.map((text) => ({
          text,
          cycleId: cycle.id,
        })),
      });
    }

    const partnerId = user.id === couple.girlId ? couple.boyId : couple.girlId;
    const partner = await this.prisma.user.findUnique({
      where: { id: partnerId },
    });

    const lines = cleanedWishes.map((text, index) => `${index + 1}. ${text}`);
    const wishesText = lines.length
      ? `\n\nСписок желаний:\n\n${lines.join('\n')}`
      : '\n\nПока список желаний пуст.';

    if (user.telegramId) {
      await this.bot.telegram.sendMessage(
        user.telegramId,
        `Сайт обновил твой список желаний.${wishesText}`,
      );
    }

    if (partner?.telegramId) {
      await this.bot.telegram.sendMessage(
        partner.telegramId,
        `Твой партнёр обновил список желаний.${wishesText}`,
      );
    }

    return { ok: true };
  }
}
