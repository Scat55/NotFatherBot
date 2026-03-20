import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { PrismaService } from '../prisma/prisma.service';
import { TemplatesService } from '../templates/templates.service';

interface CreateCycleDto {
  cycleLength?: number;
  startDate?: string;
}

@Injectable()
export class CyclesService {
  constructor(
    private prisma: PrismaService,
    private templatesService: TemplatesService,
    @InjectBot() private bot: Telegraf,
  ) {}

  async findAll(coupleId: number, userId: number) {
    await this.assertMember(coupleId, userId);

    return this.prisma.cycle.findMany({
      where: { coupleId },
      include: {
        entries: true,
        _count: { select: { entries: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async findActive(coupleId: number, userId: number) {
    await this.assertMember(coupleId, userId);

    const cycle = await this.prisma.cycle.findFirst({
      where: { coupleId, isActive: true },
      include: {
        entries: { orderBy: { id: 'asc' } },
      },
    });

    return cycle ?? null;
  }

  async create(coupleId: number, userId: number, dto: CreateCycleDto) {
    const couple = await this.assertMember(coupleId, userId);

    if (couple.creatorId !== userId) {
      throw new ForbiddenException('Only couple creator can start a cycle');
    }

    // Берём последний цикл — нужен и для проверки даты и для длины
    const lastCycle = await this.prisma.cycle.findFirst({
      where: { coupleId },
      orderBy: { createdAt: 'desc' },
    });

    if (lastCycle) {
      const daysSinceLast = Math.floor(
        (Date.now() - lastCycle.createdAt.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysSinceLast < 10) {
        throw new BadRequestException(
          `Новый цикл можно создать через ${10 - daysSinceLast} дн.`,
        );
      }
    }

    // Деактивируем текущий активный цикл
    await this.prisma.cycle.updateMany({
      where: { coupleId, isActive: true },
      data: { isActive: false },
    });

    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    const cycleLength = dto.cycleLength ?? lastCycle?.cycleLength ?? 28;

    const newCycle = await this.prisma.cycle.create({
      data: { coupleId, startDate, cycleLength, isActive: true },
    });

    // Копируем хотелки как снапшот
    const wishes = await this.prisma.wish.findMany({
      where: { coupleId },
      orderBy: { order: 'asc' },
    });

    if (wishes.length) {
      await this.prisma.cycleWishEntry.createMany({
        data: wishes.map((w) => ({
          cycleId: newCycle.id,
          wishText: w.text,
          cost: w.cost,
          done: false,
        })),
      });
    }

    // Отправляем партнёру только шаблоны БЕЗ хотелок
    if (couple.partnerId) {
      const partner = await this.prisma.user.findUnique({
        where: { id: couple.partnerId },
      });

      if (partner?.telegramId) {
        const allTemplates = await this.templatesService.findAll(userId);
        const templatesWithoutWishes = allTemplates.filter(
          (t) => !t.includeWishes,
        );

        for (const template of templatesWithoutWishes) {
          this.bot.telegram
            .sendMessage(partner.telegramId, template.text)
            .catch((e) =>
              console.warn(
                `Не удалось отправить шаблон "${template.title}":`,
                e.message,
              ),
            );
        }

        // Если нет шаблонов без хотелок — базовое уведомление
        if (!templatesWithoutWishes.length) {
          const creator = await this.prisma.user.findUnique({
            where: { id: couple.creatorId },
          });
          const creatorName =
            creator?.username ||
            `${creator?.firstName ?? ''} ${creator?.lastName ?? ''}`.trim() ||
            'Партнёр';

          this.bot.telegram
            .sendMessage(
              partner.telegramId,
              `❗️ ${creatorName} запустила новый цикл!\nДлина: ${cycleLength} дней.`,
            )
            .catch((e) =>
              console.warn('Не удалось отправить уведомление:', e.message),
            );
        }
      }
    }

    return this.prisma.cycle.findUnique({
      where: { id: newCycle.id },
      include: { entries: { orderBy: { id: 'asc' } } },
    });
  }

  async toggleEntry(
    cycleId: number,
    entryId: number,
    userId: number,
    done: boolean,
  ) {
    const cycle = await this.prisma.cycle.findUnique({
      where: { id: cycleId },
      include: { couple: true },
    });

    if (!cycle) throw new NotFoundException('Cycle not found');

    const couple = cycle.couple;

    if (couple.creatorId !== userId && couple.partnerId !== userId) {
      throw new ForbiddenException('You are not a member of this couple');
    }

    if (couple.creatorId === userId) {
      throw new ForbiddenException('Only partner can mark entries as done');
    }

    const entry = await this.prisma.cycleWishEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry) throw new NotFoundException('Entry not found');
    if (entry.cycleId !== cycleId) {
      throw new BadRequestException('Entry does not belong to this cycle');
    }

    // Начисляем/списываем монеты
    if (done && !entry.done) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { balance: { increment: entry.cost } },
      });
    } else if (!done && entry.done) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { balance: { decrement: entry.cost } },
      });
    }

    // Уведомляем создателя о выполнении
    if (done && !entry.done) {
      const creator = await this.prisma.user.findUnique({
        where: { id: couple.creatorId },
      });

      if (creator?.telegramId) {
        const partner = await this.prisma.user.findUnique({
          where: { id: userId },
        });

        const partnerName =
          partner?.username ||
          `${partner?.firstName ?? ''} ${partner?.lastName ?? ''}`.trim() ||
          'Партнёр';

        this.bot.telegram
          .sendMessage(
            creator.telegramId,
            `✅ ${partnerName} выполнил хотелку «${entry.wishText}» и получил ${entry.cost} 🪙`,
          )
          .catch((e) =>
            console.warn('Не удалось отправить уведомление:', e.message),
          );
      }
    }

    return this.prisma.cycleWishEntry.update({
      where: { id: entryId },
      data: { done },
    });
  }

  private async assertMember(coupleId: number, userId: number) {
    const couple = await this.prisma.couple.findUnique({
      where: { id: coupleId },
    });

    if (!couple) throw new NotFoundException('Couple not found');

    if (couple.creatorId !== userId && couple.partnerId !== userId) {
      throw new ForbiddenException('You are not a member of this couple');
    }

    return couple;
  }
}
