import { Module } from '@nestjs/common';
import { UsersController } from './user.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, JwtModule], // импортируем AuthModule, чтобы получить JwtModule
  controllers: [UsersController],
  providers: [PrismaService],
})
export class UsersModule {}
