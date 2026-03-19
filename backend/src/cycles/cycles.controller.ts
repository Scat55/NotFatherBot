import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { CyclesService } from './cycles.service';
import { JwtAuthGuard, CurrentUser } from '../auth/jwt.guard';

@Controller('couples/:coupleId/cycles')
@UseGuards(JwtAuthGuard)
export class CyclesController {
  constructor(private cyclesService: CyclesService) {}

  // GET /couples/:coupleId/cycles — все циклы пары
  @Get()
  findAll(
    @Param('coupleId', ParseIntPipe) coupleId: number,
    @CurrentUser() user: { userId: number },
  ) {
    return this.cyclesService.findAll(coupleId, user.userId);
  }

  // GET /couples/:coupleId/cycles/active — активный цикл
  @Get('active')
  findActive(
    @Param('coupleId', ParseIntPipe) coupleId: number,
    @CurrentUser() user: { userId: number },
  ) {
    return this.cyclesService.findActive(coupleId, user.userId);
  }

  // POST /couples/:coupleId/cycles — создать новый цикл
  @Post()
  create(
    @Param('coupleId', ParseIntPipe) coupleId: number,
    @CurrentUser() user: { userId: number },
    @Body() body: { cycleLength?: number; startDate?: string },
  ) {
    return this.cyclesService.create(coupleId, user.userId, body);
  }

  // PATCH /couples/:coupleId/cycles/:cycleId/entries/:entryId — отметить выполненным
  @Patch(':cycleId/entries/:entryId')
  toggleEntry(
    @Param('cycleId', ParseIntPipe) cycleId: number,
    @Param('entryId', ParseIntPipe) entryId: number,
    @CurrentUser() user: { userId: number },
    @Body() body: { done: boolean },
  ) {
    return this.cyclesService.toggleEntry(
      cycleId,
      entryId,
      user.userId,
      body.done,
    );
  }
}
