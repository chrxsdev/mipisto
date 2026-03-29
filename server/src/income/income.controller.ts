import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { JwtUser } from '../common/interfaces/jwt-user.interface';
import { IncomeDto } from './dto/income.dto';
import { IncomeQueryDto } from './dto/income-query.dto';
import { IncomeService } from './income.service';

@Controller('income')
@UseGuards(JwtAuthGuard)
export class IncomeController {
  constructor(private readonly incomeService: IncomeService) {}

  @Get()
  findAll(@CurrentUser() user: JwtUser, @Query() query: IncomeQueryDto) {
    return this.incomeService.findAll(user.sub, query);
  }

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: IncomeDto) {
    return this.incomeService.create(user.sub, dto);
  }

  @Put(':id')
  update(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: IncomeDto,
  ) {
    return this.incomeService.update(user.sub, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.incomeService.remove(user.sub, id);
  }
}
