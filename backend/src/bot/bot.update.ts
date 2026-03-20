import { Update, Start, Command, Ctx, On } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { PrismaService } from '../prisma/prisma.service';

@Update()
export class BotUpdate {
  constructor(private prisma: PrismaService) {}

  @Start()
  async start(@Ctx() ctx: Context) {
    const telegramIdNum = ctx.from.id;
    const telegramId = telegramIdNum.toString();
    const username = ctx.from.username;
    const firstName = ctx.from.first_name;
    const lastName = ctx.from.last_name;

    let photoUrl: string | null = null;

    try {
      const photos = await ctx.telegram.getUserProfilePhotos(
        telegramIdNum,
        0,
        1,
      );
      if (photos.total_count > 0) {
        const fileId = photos.photos[0][0].file_id;
        const link = await ctx.telegram.getFileLink(fileId);
        photoUrl = link.toString();
      }
    } catch (e: any) {
      console.warn('Не удалось получить фото пользователя:', e.message);
    }

    let payload: string | undefined;
    if (ctx.message && 'text' in ctx.message) {
      payload = ctx.message.text.split(' ')[1];
    }

    await this.prisma.user.upsert({
      where: { telegramId },
      update: { username, firstName, lastName, photoUrl },
      create: { telegramId, username, firstName, lastName, photoUrl },
    });

    if (payload?.startsWith('login_')) {
      const token = payload.replace('login_', '');
      await this.prisma.telegramLogin.update({
        where: { token },
        data: { telegramId },
      });
      await ctx.reply('Авторизация подтверждена. Вернись на сайт.');
      return;
    }

    if (payload?.startsWith('invite_')) {
      const inviteToken = payload.replace('invite_', '');
      const couple = await this.prisma.couple.findUnique({
        where: { inviteToken },
      });

      if (!couple) {
        await ctx.reply('Ссылка-приглашение недействительна.');
        return;
      }
      if (couple.inviteExpiresAt < new Date()) {
        await ctx.reply(
          'Срок действия ссылки истёк. Попроси партнёра создать новую.',
        );
        return;
      }
      if (couple.partnerId) {
        await ctx.reply('В эту пару уже кто-то вступил.');
        return;
      }

      const user = await this.prisma.user.findUnique({ where: { telegramId } });
      if (couple.creatorId === user.id) {
        await ctx.reply('Нельзя вступить в собственную пару.');
        return;
      }

      await this.prisma.couple.update({
        where: { inviteToken },
        data: { partnerId: user.id, inviteToken: null, inviteExpiresAt: null },
      });

      await ctx.reply('Ты вступил в пару ✅');
      return;
    }

    await ctx.reply('Ты зарегистрирован в системе.');
  }

  // Обработчик текстовых сообщений — реагирует на "ДА"
  @On('text')
  async onText(@Ctx() ctx: Context) {
    if (!('text' in ctx.message)) return;

    const text = ctx.message.text.trim();

    // Пропускаем команды
    if (text.startsWith('/')) return;

    const telegramId = ctx.from.id.toString();

    if (text.toLowerCase() === 'да') {
      const user = await this.prisma.user.findUnique({ where: { telegramId } });
      if (!user) return;

      // Находим пару где пользователь партнёр
      const couple = await this.prisma.couple.findFirst({
        where: { partnerId: user.id },
        orderBy: { createdAt: 'desc' },
      });

      if (!couple) return;

      // Берём шаблоны создателя с includeWishes: true
      const templates = await this.prisma.template.findMany({
        where: { userId: couple.creatorId, includeWishes: true },
        orderBy: { order: 'asc' },
      });

      if (!templates.length) return;

      // Получаем хотелки пары
      const wishes = await this.prisma.wish.findMany({
        where: { coupleId: couple.id },
        orderBy: { order: 'asc' },
      });

      const wishesText = wishes.length
        ? wishes.map((w, i) => `- ${w.text}`).join('\n')
        : 'Список пока пуст.';

      for (const template of templates) {
        // Подставляем хотелки вместо {{wishes}} если есть плейсхолдер
        const messageText = template.text.includes('{{wishes}}')
          ? template.text.replace('{{wishes}}', wishesText)
          : `${template.text}\n\n${wishesText}`;

        await ctx.reply(messageText);
      }
    }
  }

  @Command('wish')
  async addWish(@Ctx() ctx: Context) {
    const text = ctx.message['text'].replace('/wish', '').trim();
    if (!text) {
      await ctx.reply(
        'Напиши желание после команды, например: /wish купить цветы',
      );
      return;
    }

    const telegramId = ctx.from.id.toString();
    const user = await this.prisma.user.findUnique({ where: { telegramId } });
    if (!user) {
      await ctx.reply('Сначала нажми /start, чтобы зарегистрироваться');
      return;
    }

    const couple = await this.prisma.couple.findFirst({
      where: { OR: [{ creatorId: user.id }, { partnerId: user.id }] },
      orderBy: { createdAt: 'desc' },
    });

    if (!couple) {
      await ctx.reply('Сначала создай пару на сайте.');
      return;
    }

    if (couple.creatorId !== user.id) {
      await ctx.reply('Добавлять хотелки может только создатель пары.');
      return;
    }

    const last = await this.prisma.wish.findFirst({
      where: { coupleId: couple.id },
      orderBy: { order: 'desc' },
    });

    const wish = await this.prisma.wish.create({
      data: { text, coupleId: couple.id, order: last ? last.order + 1 : 0 },
    });

    await ctx.reply(`Желание добавлено ✅\n\n${wish.text}`);
  }

  @Command('pairs')
  async myPairs(@Ctx() ctx: Context) {
    const telegramId = ctx.from.id.toString();
    const user = await this.prisma.user.findUnique({ where: { telegramId } });
    if (!user) {
      await ctx.reply('Сначала нажми /start, чтобы зарегистрироваться');
      return;
    }

    const couples = await this.prisma.couple.findMany({
      where: { OR: [{ creatorId: user.id }, { partnerId: user.id }] },
      include: { creator: true, partner: true },
      orderBy: { createdAt: 'asc' },
    });

    if (!couples.length) {
      await ctx.reply('У тебя пока нет пар.');
      return;
    }

    const lines = couples.map((couple, index) => {
      const creatorName =
        couple.creator.username ||
        `${couple.creator.firstName || ''} ${couple.creator.lastName || ''}`.trim() ||
        'Без имени (создатель)';

      const partnerName = couple.partner
        ? couple.partner.username ||
          `${couple.partner.firstName || ''} ${couple.partner.lastName || ''}`.trim() ||
          'Без имени (партнёр)'
        : 'Ожидает партнёра...';

      return `${index + 1}. ${creatorName} ❤️ ${partnerName}`;
    });

    await ctx.reply(`Твои пары:\n\n${lines.join('\n')}`);
  }

  @Command('wishes')
  async myWishes(@Ctx() ctx: Context) {
    const telegramId = ctx.from.id.toString();
    const user = await this.prisma.user.findUnique({ where: { telegramId } });
    if (!user) {
      await ctx.reply('Сначала нажми /start, чтобы зарегистрироваться');
      return;
    }

    const couple = await this.prisma.couple.findFirst({
      where: { OR: [{ creatorId: user.id }, { partnerId: user.id }] },
      orderBy: { createdAt: 'desc' },
    });

    if (!couple) {
      await ctx.reply('Сначала создай пару на сайте.');
      return;
    }

    const wishes = await this.prisma.wish.findMany({
      where: { coupleId: couple.id },
      orderBy: { order: 'asc' },
    });

    if (!wishes.length) {
      await ctx.reply('У этой пары ещё нет хотелок.');
      return;
    }

    const lines = wishes.map(
      (wish, index) =>
        `${index + 1}. ${wish.done ? '✅' : '⬜'} ${wish.text} (${wish.cost} 🪙)`,
    );

    await ctx.reply(`Хотелки:\n\n${lines.join('\n')}`);
  }

  @Command('cycle')
  async createCycle(@Ctx() ctx: Context) {
    const telegramId = ctx.from.id.toString();
    const args = ctx.message['text'].split(' ').slice(1).filter(Boolean);
    const cycleLength = Number(args[0]);

    if (!cycleLength || cycleLength <= 0) {
      await ctx.reply('Укажи длину цикла в днях, например:\n/cycle 28');
      return;
    }

    const user = await this.prisma.user.findUnique({ where: { telegramId } });
    if (!user) {
      await ctx.reply('Сначала нажми /start, чтобы зарегистрироваться');
      return;
    }

    const couple = await this.prisma.couple.findFirst({
      where: { creatorId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (!couple) {
      await ctx.reply('Сначала создай пару на сайте.');
      return;
    }

    let startDate = new Date();
    if (args[1]) {
      const parsed = new Date(args[1]);
      if (!Number.isNaN(parsed.getTime())) startDate = parsed;
    }

    const cycle = await this.prisma.cycle.create({
      data: { coupleId: couple.id, startDate, cycleLength },
    });

    await ctx.reply(`Цикл создан ✅\nДлительность: ${cycle.cycleLength} дней`);
  }

  @Command('period')
  async periodStart(@Ctx() ctx: Context) {
    const telegramId = ctx.from.id.toString();
    const user = await this.prisma.user.findUnique({ where: { telegramId } });
    if (!user) {
      await ctx.reply('Сначала нажми /start, чтобы зарегистрироваться');
      return;
    }

    const couple = await this.prisma.couple.findFirst({
      where: { creatorId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (!couple) {
      await ctx.reply(
        'Эта команда доступна только создателю пары.\nСначала создай пару на сайте.',
      );
      return;
    }

    const previousCycle = await this.prisma.cycle.findFirst({
      where: { coupleId: couple.id },
      orderBy: { startDate: 'desc' },
    });

    const cycleLength = previousCycle?.cycleLength ?? 28;

    await this.prisma.cycle.create({
      data: { coupleId: couple.id, startDate: new Date(), cycleLength },
    });

    await ctx.reply(
      `Новый цикл на ${cycleLength} дней запущен ✅\n` +
        (couple.partnerId
          ? 'Я отправил партнёру уведомление.'
          : 'Партнёр ещё не присоединился к паре.'),
    );
  }
}
