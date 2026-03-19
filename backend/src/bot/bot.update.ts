import { Update, Start, Command, Ctx } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { PrismaService } from '../prisma/prisma.service';

@Update()
export class BotUpdate {
  constructor(private prisma: PrismaService) {}

  @Start()
  async start(@Ctx() ctx: Context) {
    const telegramIdNum = ctx.from.id; // number для Telegram API
    const telegramId = telegramIdNum.toString(); // string для Prisma
    const username = ctx.from.username;
    const firstName = ctx.from.first_name;
    const lastName = ctx.from.last_name;

    let photoUrl: string | null = null;

    // Получаем фото профиля
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

    // Проверяем, что сообщение действительно текстовое
    let payload: string | undefined;
    if (ctx.message && 'text' in ctx.message) {
      payload = ctx.message.text.split(' ')[1];
    }

    // Апсёрт пользователя в базе
    await this.prisma.user.upsert({
      where: { telegramId },
      update: {
        username,
        firstName,
        lastName,
        photoUrl,
      },
      create: {
        telegramId,
        username,
        firstName,
        lastName,
        photoUrl,
      },
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

    const user = await this.prisma.user.findUnique({
      where: { telegramId },
    });

    if (!user) {
      await ctx.reply('Сначала нажми /start, чтобы зарегистрироваться');
      return;
    }

    const couple = await this.prisma.couple.findFirst({
      where: {
        OR: [{ girlId: user.id }, { boyId: user.id }],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!couple) {
      await ctx.reply('Сначала создай пару командой:\n/couple <id партнёра>');
      return;
    }

    const cycle = await this.prisma.cycle.findFirst({
      where: { coupleId: couple.id },
      orderBy: { startDate: 'desc' },
    });

    if (!cycle) {
      await ctx.reply(
        'Сначала создай цикл командой:\n/cycle <длина_цикла_в_днях>',
      );
      return;
    }

    const wish = await this.prisma.wish.create({
      data: {
        text,
        cycleId: cycle.id,
      },
    });

    await ctx.reply(`Желание добавлено ✅\n\n${wish.text}`);
  }

  @Command('couple')
  async createCouple(@Ctx() ctx: Context) {
    const telegramId = ctx.from.id.toString();
    const partnerArg = ctx.message['text'].replace('/couple', '').trim();

    if (!partnerArg) {
      await ctx.reply(
        'Укажи username партнёра, например:\n/couple @partner_username',
      );
      return;
    }

    const partnerUsername = partnerArg.replace(/^@/, '');

    const user = await this.prisma.user.findUnique({ where: { telegramId } });
    const partner = await this.prisma.user.findFirst({
      where: { username: partnerUsername },
    });

    if (!user) {
      await ctx.reply('Сначала нажми /start, чтобы зарегистрироваться');
      return;
    }

    if (!partner) {
      await ctx.reply('Партнёр ещё не нажал /start в боте');
      return;
    }

    const isGirlFirst = user.id < partner.id;

    const couple = await this.prisma.couple.create({
      data: {
        girlId: isGirlFirst ? user.id : partner.id,
        boyId: isGirlFirst ? partner.id : user.id,
      },
    });

    await ctx.reply(
      `Пара создана ✅\nID пары: ${couple.id}\nТеперь можешь создать цикл командой:\n/cycle <длина_цикла_в_днях>`,
    );
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
      where: {
        OR: [{ girlId: user.id }, { boyId: user.id }],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!couple) {
      await ctx.reply('Сначала создай пару командой:\n/couple <id партнёра>');
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
      data: {
        coupleId: couple.id,
        startDate,
        cycleLength,
      },
    });

    await ctx.reply(
      `Цикл создан ✅\nДлительность: ${cycle.cycleLength} дней\nТеперь можешь добавлять желания командой:\n/wish <желание>`,
    );
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
        OR: [{ girlId: user.id }, { boyId: user.id }],
      },
      include: {
        girl: true,
        boy: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!couples.length) {
      await ctx.reply('У тебя пока нет пар.');
      return;
    }

    const lines = couples.map((couple, index) => {
      const girlName =
        couple.girl.username ||
        `${couple.girl.firstName || ''} ${couple.girl.lastName || ''}`.trim() ||
        'Без имени (девушка)';

      const boyName =
        couple.boy.username ||
        `${couple.boy.firstName || ''} ${couple.boy.lastName || ''}`.trim() ||
        'Без имени (парень)';
      return `${index + 1}. ${girlName} ❤️ ${boyName}`;
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
        OR: [{ girlId: user.id }, { boyId: user.id }],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!couple) {
      await ctx.reply('Сначала создай пару командой:\n/couple @username');
      return;
    }

    const cycle = await this.prisma.cycle.findFirst({
      where: { coupleId: couple.id },
      orderBy: { startDate: 'desc' },
    });

    if (!cycle) {
      await ctx.reply(
        'У этой пары ещё нет цикла. Создай его командой:\n/cycle <длина_цикла_в_днях> [ГГГГ-ММ-ДД]',
      );
      return;
    }

    const wishes = await this.prisma.wish.findMany({
      where: { cycleId: cycle.id },
      orderBy: { id: 'asc' },
    });

    if (!wishes.length) {
      await ctx.reply('В текущем цикле ещё нет желаний.');
      return;
    }

    const lines = wishes.map((wish, index) => `${index + 1}. ${wish.text}`);

    await ctx.reply(`Желания текущего цикла:\n\n${lines.join('\n')}`);
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
      where: {
        girlId: user.id,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!couple) {
      await ctx.reply(
        'Эта команда доступна только девушке в паре.\n' +
          'Сначала создай пару командой:\n/couple @username',
      );
      return;
    }

    const previousCycle = await this.prisma.cycle.findFirst({
      where: { coupleId: couple.id },
      orderBy: { startDate: 'desc' },
    });

    const cycleLength = previousCycle?.cycleLength ?? 28;

    const newCycle = await this.prisma.cycle.create({
      data: {
        coupleId: couple.id,
        startDate: new Date(),
        cycleLength,
      },
    });

    if (previousCycle) {
      const prevWishes = await this.prisma.wish.findMany({
        where: { cycleId: previousCycle.id },
        orderBy: { id: 'asc' },
      });

      for (const wish of prevWishes) {
        // копируем желания из предыдущего цикла в новый
        // eslint-disable-next-line no-await-in-loop
        await this.prisma.wish.create({
          data: {
            text: wish.text,
            cycleId: newCycle.id,
          },
        });
      }
    }

    const partner = await this.prisma.user.findUnique({
      where: { id: couple.boyId },
    });

    let wishesText = '';
    const currentWishes = await this.prisma.wish.findMany({
      where: { cycleId: newCycle.id },
      orderBy: { id: 'asc' },
    });

    if (currentWishes.length) {
      const lines = currentWishes.map(
        (wish, index) => `${index + 1}. ${wish.text}`,
      );
      wishesText = `\n\nВот её желания:\n\n${lines.join('\n')}`;
    } else {
      wishesText =
        '\n\nПока нет сохранённых желаний на этот цикл. Спросите её, чего бы ей хотелось ❤️';
    }

    if (partner?.telegramId) {
      await ctx.telegram.sendMessage(
        partner.telegramId,
        `У вашей пары сегодня начались месячные.\n` +
          `Новый цикл длиной ${newCycle.cycleLength} дней.${wishesText}`,
      );
    }

    await ctx.reply(
      `Я запомнил, что сегодня начались месячные.\n` +
        `Цикл на ${cycleLength} дней уже запущен, ` +
        (partner?.telegramId
          ? 'и я отправил твоему партнёру список желаний.'
          : 'но я не смог найти твоего партнёра в боте, поэтому не смог отправить ему сообщение.'),
    );
  }
}
