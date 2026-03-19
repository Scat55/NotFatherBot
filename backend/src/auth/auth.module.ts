import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default_secret', // 🔑 обязательно
      signOptions: { expiresIn: '7d' }, // или как тебе нужно
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService],
  exports: [JwtModule, AuthService],
})
export class AuthModule {}
