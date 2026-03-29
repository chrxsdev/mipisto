import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { JwtUser } from '../common/interfaces/jwt-user.interface';
import { CreditCardDto } from './dto/credit-card.dto';
import { CreditCardsService } from './credit-cards.service';

@Controller('credit-cards')
@UseGuards(JwtAuthGuard)
export class CreditCardsController {
  constructor(private readonly creditCardsService: CreditCardsService) {}

  @Get()
  findAll(@CurrentUser() user: JwtUser) {
    return this.creditCardsService.findAll(user.sub);
  }

  @Get('active')
  findActive(@CurrentUser() user: JwtUser) {
    return this.creditCardsService.findActive(user.sub);
  }

  @Get(':id/spending')
  getSpending(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.creditCardsService.getSpending(user.sub, id);
  }

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreditCardDto) {
    return this.creditCardsService.create(user.sub, dto);
  }

  @Put(':id')
  update(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: CreditCardDto,
  ) {
    return this.creditCardsService.update(user.sub, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.creditCardsService.remove(user.sub, id);
  }

  @Patch(':id/toggle')
  toggle(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.creditCardsService.toggle(user.sub, id);
  }
}
