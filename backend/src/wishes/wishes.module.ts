import { Module } from '@nestjs/common';
import { WishesController } from './wishes.controller';
import { WishesService } from './wishes.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [WishesController],
  providers: [WishesService],
})
export class WishesModule {}
