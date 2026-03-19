import { Module } from '@nestjs/common';
import { CyclesController } from './cycles.controller';
import { CyclesService } from './cycles.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { TelegrafModule } from 'nestjs-telegraf';

@Module({
  imports: [PrismaModule, AuthModule, TelegrafModule],
  controllers: [CyclesController],
  providers: [CyclesService],
  exports: [CyclesService],
})
export class CyclesModule {}
