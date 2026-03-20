import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'crypto';

@Injectable()
export class CouplesService {
  constructor(private prisma: PrismaService) {}

  // Создать пару + сгенерировать инвайт-токен
  async create(userId: number) {
    const inviteToken = randomUUID();
    const inviteExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    return this.prisma.couple.create({
      data: {
        creatorId: userId,
        inviteToken,
        inviteExpiresAt,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            photoUrl: true,
          },
        },
        partner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            photoUrl: true,
          },
        },
      },
    });
  }

  // Получить все пары пользователя
  async findAll(userId: number) {
    return this.prisma.couple.findMany({
      where: {
        OR: [{ creatorId: userId }, { partnerId: userId }],
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            photoUrl: true,
          },
        },
        partner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            photoUrl: true,
          },
        },
        _count: { select: { wishes: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Получить одну пару
  async findOne(coupleId: number, userId: number) {
    const couple = await this.prisma.couple.findUnique({
      where: { id: coupleId },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            photoUrl: true,
          },
        },
        partner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            photoUrl: true,
          },
        },
        wishes: { orderBy: { order: 'asc' } },
      },
    });

    if (!couple) throw new NotFoundException('Couple not found');
    this.assertMember(couple, userId);

    return couple;
  }

  // Предпросмотр приглашения — без авторизации
  async getInvite(inviteToken: string) {
    const couple = await this.prisma.couple.findUnique({
      where: { inviteToken },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            username: true,
            photoUrl: true,
          },
        },
      },
    });

    if (!couple) return { status: 'invalid' };
    if (couple.inviteExpiresAt < new Date()) return { status: 'expired' };
    if (couple.partnerId) return { status: 'taken' };

    return {
      status: 'valid',
      creator: couple.creator,
    };
  }

  // Принять приглашение по токену
  async join(inviteToken: string, userId: number) {
    const couple = await this.prisma.couple.findUnique({
      where: { inviteToken },
    });

    if (!couple) throw new NotFoundException('Invite not found');

    if (couple.inviteExpiresAt < new Date()) {
      throw new BadRequestException('Invite link has expired');
    }

    if (couple.partnerId) {
      throw new BadRequestException('Couple already has a partner');
    }

    if (couple.creatorId === userId) {
      throw new BadRequestException('Cannot join your own couple');
    }

    return this.prisma.couple.update({
      where: { inviteToken },
      data: {
        partnerId: userId,
        inviteToken: null,
        inviteExpiresAt: null,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            photoUrl: true,
          },
        },
        partner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            photoUrl: true,
          },
        },
      },
    });
  }

  // Выйти из пары
  async leave(coupleId: number, userId: number) {
    const couple = await this.prisma.couple.findUnique({
      where: { id: coupleId },
    });

    if (!couple) throw new NotFoundException('Couple not found');
    this.assertMember(couple, userId);

    if (couple.creatorId === userId) {
      await this.prisma.couple.delete({ where: { id: coupleId } });
      return { deleted: true };
    }

    return this.prisma.couple.update({
      where: { id: coupleId },
      data: { partnerId: null },
    });
  }

  // Перегенерировать инвайт-ссылку
  async refreshInvite(coupleId: number, userId: number) {
    const couple = await this.prisma.couple.findUnique({
      where: { id: coupleId },
    });

    if (!couple) throw new NotFoundException('Couple not found');

    if (couple.creatorId !== userId) {
      throw new ForbiddenException('Only creator can refresh invite');
    }

    const inviteToken = randomUUID();
    const inviteExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    return this.prisma.couple.update({
      where: { id: coupleId },
      data: { inviteToken, inviteExpiresAt },
    });
  }

  private assertMember(
    couple: { creatorId: number; partnerId?: number },
    userId: number,
  ) {
    if (couple.creatorId !== userId && couple.partnerId !== userId) {
      throw new ForbiddenException('You are not a member of this couple');
    }
  }
}
