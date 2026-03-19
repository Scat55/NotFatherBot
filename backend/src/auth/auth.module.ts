import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { Reflector } from '@nestjs/core';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default_secret',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, Reflector],
  exports: [JwtModule, AuthService, Reflector],
})
export class AuthModule {}
