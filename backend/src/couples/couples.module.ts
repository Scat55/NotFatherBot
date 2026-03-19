import { Module } from '@nestjs/common';
import { CouplesController } from './couples.controller';
import { CouplesService } from './couples.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CouplesController],
  providers: [CouplesService],
  exports: [CouplesService],
})
export class CouplesModule {}
