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
import { TemplatesService } from './templates.service';
import { JwtAuthGuard, CurrentUser } from '../auth/jwt.guard';

@Controller('templates')
@UseGuards(JwtAuthGuard)
export class TemplatesController {
  constructor(private templatesService: TemplatesService) {}

  // GET /templates
  @Get()
  findAll(@CurrentUser() user: { userId: number }) {
    return this.templatesService.findAll(user.userId);
  }

  // POST /templates
  @Post()
  create(
    @CurrentUser() user: { userId: number },
    @Body() body: { title: string; text: string; tag?: string },
  ) {
    return this.templatesService.create(user.userId, body);
  }

  // PATCH /templates/reorder
  @Patch('reorder')
  reorder(
    @CurrentUser() user: { userId: number },
    @Body() body: { ids: number[] },
  ) {
    return this.templatesService.reorder(user.userId, body.ids);
  }

  // PATCH /templates/:id
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { userId: number },
    @Body() body: { title?: string; text?: string; tag?: string },
  ) {
    return this.templatesService.update(id, user.userId, body);
  }

  // DELETE /templates/:id
  @Delete(':id')
  delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { userId: number },
  ) {
    return this.templatesService.delete(id, user.userId);
  }
}
