import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateWishDto {
  text: string;
  cost?: number;
}

interface UpdateWishDto {
  text?: string;
  cost?: number;
  done?: boolean;
}

interface ReorderWishDto {
  ids: number[]; // массив id в новом порядке
}

@Injectable()
export class WishesService {
  constructor(private prisma: PrismaService) {}

  async findAll(coupleId: number, userId: number) {
    await this.assertMember(coupleId, userId);

    return this.prisma.wish.findMany({
      where: { coupleId },
      orderBy: { order: 'asc' },
    });
  }

  async create(coupleId: number, userId: number, dto: CreateWishDto) {
    const couple = await this.assertMember(coupleId, userId);

    // Только создатель пары может добавлять хотелки
    if (couple.creatorId !== userId) {
      throw new ForbiddenException('Only couple creator can add wishes');
    }

    // Ставим в конец списка
    const last = await this.prisma.wish.findFirst({
      where: { coupleId },
      orderBy: { order: 'desc' },
    });

    return this.prisma.wish.create({
      data: {
        text: dto.text,
        cost: Number(dto.cost ?? 0),
        order: last ? last.order + 1 : 0,
        coupleId,
      },
    });
  }

  async update(wishId: number, userId: number, dto: UpdateWishDto) {
    const wish = await this.prisma.wish.findUnique({
      where: { id: wishId },
      include: { couple: true },
    });

    if (!wish) throw new NotFoundException('Wish not found');
    await this.assertMember(wish.coupleId, userId);

    // Отметить выполненной может только партнёр (исполнитель)
    if (dto.done !== undefined) {
      if (wish.couple.creatorId === userId) {
        throw new ForbiddenException('Only partner can mark wish as done');
      }

      // Начисляем монеты партнёру при выполнении
      if (dto.done && !wish.done) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { balance: { increment: Number(wish.cost) } },
        });
      }

      // Списываем монеты если отмечают невыполненной обратно
      if (!dto.done && wish.done) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { balance: { decrement: Number(wish.cost) } },
        });
      }
    }

    return this.prisma.wish.update({
      where: { id: wishId },
      data: {
        ...dto,
        ...(dto.cost !== undefined && { cost: Number(dto.cost) }),
      },
    });
  }

  async delete(wishId: number, userId: number) {
    const wish = await this.prisma.wish.findUnique({
      where: { id: wishId },
      include: { couple: true },
    });

    if (!wish) throw new NotFoundException('Wish not found');

    if (wish.couple.creatorId !== userId) {
      throw new ForbiddenException('Only couple creator can delete wishes');
    }

    return this.prisma.wish.delete({ where: { id: wishId } });
  }

  async reorder(coupleId: number, userId: number, dto: ReorderWishDto) {
    const couple = await this.assertMember(coupleId, userId);

    if (couple.creatorId !== userId) {
      throw new ForbiddenException('Only couple creator can reorder wishes');
    }

    // Обновляем order для каждого wish в транзакции
    await this.prisma.$transaction(
      dto.ids.map((id, index) =>
        this.prisma.wish.update({
          where: { id },
          data: { order: index },
        }),
      ),
    );

    return this.prisma.wish.findMany({
      where: { coupleId },
      orderBy: { order: 'asc' },
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
