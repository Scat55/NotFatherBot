import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { CouplesService } from './couples.service';
import { JwtAuthGuard, CurrentUser, Public } from '../auth/jwt.guard';

@Controller('couples')
@UseGuards(JwtAuthGuard)
export class CouplesController {
  constructor(private couplesService: CouplesService) {}

  // GET /couples — все пары пользователя
  @Get()
  findAll(@CurrentUser() user: { userId: number }) {
    return this.couplesService.findAll(user.userId);
  }

  // POST /couples — создать пару
  @Post()
  create(@CurrentUser() user: { userId: number }) {
    return this.couplesService.create(user.userId);
  }

  // GET /couples/invite/:token — предпросмотр приглашения (без авторизации)
  // ВАЖНО: должен быть выше @Get(':id'), иначе NestJS матчит 'invite' как :id
  @Public()
  @Get('invite/:token')
  getInvite(@Param('token') token: string) {
    return this.couplesService.getInvite(token);
  }

  // GET /couples/:id — одна пара
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { userId: number },
  ) {
    return this.couplesService.findOne(id, user.userId);
  }

  // POST /couples/join/:token — принять приглашение
  @Post('join/:token')
  join(@Param('token') token: string, @CurrentUser() user: { userId: number }) {
    return this.couplesService.join(token, user.userId);
  }

  // POST /couples/:id/invite — перегенерировать инвайт-ссылку
  @Post(':id/invite')
  refreshInvite(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { userId: number },
  ) {
    return this.couplesService.refreshInvite(id, user.userId);
  }

  // DELETE /couples/:id — выйти из пары
  @Delete(':id')
  leave(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { userId: number },
  ) {
    return this.couplesService.leave(id, user.userId);
  }
}
