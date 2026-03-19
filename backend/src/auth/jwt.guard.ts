import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  createParamDecorator,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwt: JwtService,
    private reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const auth = request.headers['authorization'];

    if (!auth) throw new UnauthorizedException('No Authorization header');

    const token = auth.replace('Bearer ', '').trim();

    try {
      const payload = this.jwt.verify(token);
      request['user'] = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request['user'];
  },
);
