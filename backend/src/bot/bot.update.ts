import { Update, Start, Command, Ctx } from 'nestjs-telegraf';
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

    // Обработка логина через токен
    if (payload?.startsWith('login_')) {
      const token = payload.replace('login_', '');

      await this.prisma.telegramLogin.update({
        where: { token },
        data: { telegramId },
      });

      await ctx.reply('Авторизация подтверждена. Вернись на сайт.');
      return;
    }

    // Обработка приглашения в пару через ссылку
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
        data: {
          partnerId: user.id,
          inviteToken: null,
          inviteExpiresAt: null,
        },
      });

      await ctx.reply('Ты вступил в пару ✅');
      return;
    }

    await ctx.reply('Ты зарегистрирован в системе.');
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
      where: {
        OR: [{ creatorId: user.id }, { partnerId: user.id }],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!couple) {
      await ctx.reply('Сначала создай пару на сайте.');
      return;
    }

    // Только создатель пары может добавлять хотелки
    if (couple.creatorId !== user.id) {
      await ctx.reply('Добавлять хотелки может только создатель пары.');
      return;
    }

    const last = await this.prisma.wish.findFirst({
      where: { coupleId: couple.id },
      orderBy: { order: 'desc' },
    });

    const wish = await this.prisma.wish.create({
      data: {
        text,
        coupleId: couple.id,
        order: last ? last.order + 1 : 0,
      },
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
      where: {
        OR: [{ creatorId: user.id }, { partnerId: user.id }],
      },
      include: {
        creator: true,
        partner: true,
      },
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
      where: {
        OR: [{ creatorId: user.id }, { partnerId: user.id }],
      },
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
    const lengthArg = args[0];
    const dateArg = args[1];
    const cycleLength = Number(lengthArg);

    if (!cycleLength || cycleLength <= 0) {
      await ctx.reply(
        'Укажи длину цикла в днях, например:\n/cycle 28 или /cycle 28 2026-03-09',
      );
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
    if (dateArg) {
      const parsed = new Date(dateArg);
      if (Number.isNaN(parsed.getTime())) {
        await ctx.reply(
          'Не смог разобрать дату. Используй формат:\n/cycle 28 2026-03-09',
        );
        return;
      }
      startDate = parsed;
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

    // Только создатель пары может запускать период
    const couple = await this.prisma.couple.findFirst({
      where: { creatorId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (!couple) {
      await ctx.reply(
        'Эта команда доступна только создателю пары.\n' +
          'Сначала создай пару на сайте.',
      );
      return;
    }

    const previousCycle = await this.prisma.cycle.findFirst({
      where: { coupleId: couple.id },
      orderBy: { startDate: 'desc' },
    });

    const cycleLength = previousCycle?.cycleLength ?? 28;

    const newCycle = await this.prisma.cycle.create({
      data: { coupleId: couple.id, startDate: new Date(), cycleLength },
    });

    // Получаем текущие хотелки пары для отправки партнёру
    const wishes = await this.prisma.wish.findMany({
      where: { coupleId: couple.id, done: false },
      orderBy: { order: 'asc' },
    });

    let wishesText = '';
    if (wishes.length) {
      const lines = wishes.map(
        (wish, index) => `${index + 1}. ${wish.text} (${wish.cost} 🪙)`,
      );
      wishesText = `\n\nВот её желания:\n\n${lines.join('\n')}`;
    } else {
      wishesText =
        '\n\nПока нет сохранённых желаний. Спросите её, чего бы ей хотелось ❤️';
    }

    if (couple.partnerId) {
      const partner = await this.prisma.user.findUnique({
        where: { id: couple.partnerId },
      });

      if (partner?.telegramId) {
        await ctx.telegram.sendMessage(
          partner.telegramId,
          `У вашей пары сегодня начался новый цикл.\n` +
            `Длина: ${newCycle.cycleLength} дней.${wishesText}`,
        );
      }
    }

    await ctx.reply(
      `Новый цикл на ${cycleLength} дней запущен ✅\n` +
        (couple.partnerId
          ? 'Я отправил партнёру список хотелок.'
          : 'Партнёр ещё не присоединился к паре.'),
    );
  }
}
