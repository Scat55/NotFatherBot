import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { WishesService } from './wishes.service';
import { JwtAuthGuard, CurrentUser } from '../auth/jwt.guard';

@Controller('couples/:coupleId/wishes')
@UseGuards(JwtAuthGuard)
export class WishesController {
  constructor(private wishesService: WishesService) {}

  // GET /couples/:coupleId/wishes
  @Get()
  findAll(
    @Param('coupleId', ParseIntPipe) coupleId: number,
    @CurrentUser() user: { userId: number },
  ) {
    return this.wishesService.findAll(coupleId, user.userId);
  }

  // POST /couples/:coupleId/wishes
  @Post()
  create(
    @Param('coupleId', ParseIntPipe) coupleId: number,
    @CurrentUser() user: { userId: number },
    @Body() body: { text: string; cost?: number },
  ) {
    return this.wishesService.create(coupleId, user.userId, body);
  }

  // PATCH /couples/:coupleId/wishes/reorder
  @Patch('reorder')
  reorder(
    @Param('coupleId', ParseIntPipe) coupleId: number,
    @CurrentUser() user: { userId: number },
    @Body() body: { ids: number[] },
  ) {
    return this.wishesService.reorder(coupleId, user.userId, body);
  }

  // PATCH /couples/:coupleId/wishes/:id
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { userId: number },
    @Body() body: { text?: string; cost?: number; done?: boolean },
  ) {
    return this.wishesService.update(id, user.userId, body);
  }

  // DELETE /couples/:coupleId/wishes/:id
  @Delete(':id')
  delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { userId: number },
  ) {
    return this.wishesService.delete(id, user.userId);
  }
}
