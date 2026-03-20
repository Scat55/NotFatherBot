import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { BotUpdate } from './bot/bot.update';
import { BotController } from './bot/bot.controller';
import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './user/user.module';
import { CouplesModule } from './couples/couples.module';
import { WishesModule } from './wishes/wishes.module';
import { CyclesModule } from './cycles/cycles.module';
import { TemplatesModule } from './templates/templates.module';
import { SocksProxyAgent } from 'socks-proxy-agent';

@Module({
  imports: [
    ConfigModule.forRoot(),

    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        token: config.get<string>('BOT_TOKEN'),
        telegrafOptions: {
          telegram: {
            agent: new SocksProxyAgent(config.get<string>('PROXY_URL')),
          },
        },
      }),
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CouplesModule,
    WishesModule,
    CyclesModule,
    TemplatesModule,
  ],
  controllers: [BotController],
  providers: [PrismaService, BotUpdate],
})
export class AppModule {}
