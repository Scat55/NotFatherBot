import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateTemplateDto {
  title: string;
  text: string;
  tag?: string;
  includeWishes?: boolean;
}

interface UpdateTemplateDto {
  title?: string;
  text?: string;
  tag?: string;
  includeWishes?: boolean;
}

@Injectable()
export class TemplatesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: number) {
    return this.prisma.template.findMany({
      where: { userId },
      orderBy: { order: 'asc' },
    });
  }

  async create(userId: number, dto: CreateTemplateDto) {
    const last = await this.prisma.template.findFirst({
      where: { userId },
      orderBy: { order: 'desc' },
    });

    return this.prisma.template.create({
      data: {
        userId,
        title: dto.title,
        text: dto.text,
        tag: dto.tag ?? null,
        includeWishes: dto.includeWishes ?? false,
        order: last ? last.order + 1 : 0,
      },
    });
  }

  async update(templateId: number, userId: number, dto: UpdateTemplateDto) {
    const template = await this.prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) throw new NotFoundException('Template not found');
    if (template.userId !== userId) {
      throw new ForbiddenException('Not your template');
    }

    return this.prisma.template.update({
      where: { id: templateId },
      data: dto,
    });
  }

  async delete(templateId: number, userId: number) {
    const template = await this.prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) throw new NotFoundException('Template not found');
    if (template.userId !== userId) {
      throw new ForbiddenException('Not your template');
    }

    return this.prisma.template.delete({ where: { id: templateId } });
  }

  async reorder(userId: number, ids: number[]) {
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.template.updateMany({
          where: { id, userId },
          data: { order: index },
        }),
      ),
    );

    return this.prisma.template.findMany({
      where: { userId },
      orderBy: { order: 'asc' },
    });
  }
}
