import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { JwtUser } from '../common/interfaces/jwt-user.interface';
import { ExpenseDto } from './dto/expense.dto';
import { ExpensesQueryDto } from './dto/expenses-query.dto';
import { ExpensesService } from './expenses.service';

@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  findAll(@CurrentUser() user: JwtUser, @Query() query: ExpensesQueryDto) {
    return this.expensesService.findAll(user.sub, query);
  }

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: ExpenseDto) {
    return this.expensesService.create(user.sub, dto);
  }

  @Put(':id')
  update(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: ExpenseDto,
  ) {
    return this.expensesService.update(user.sub, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.expensesService.remove(user.sub, id);
  }
}
