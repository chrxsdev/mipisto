import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { IsIn, IsString } from 'class-validator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { JwtUser } from '../common/interfaces/jwt-user.interface';
import { UsersService } from './users.service';

class UpdateSettingsDto {
  @IsString()
  @IsIn(['USD', 'LPS'])
  currency!: string;
}

@Controller('user/settings')
@UseGuards(JwtAuthGuard)
export class UserSettingsController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getSettings(@CurrentUser() user: JwtUser) {
    return this.usersService.getSettings(user.sub);
  }

  @Put()
  updateSettings(
    @CurrentUser() user: JwtUser,
    @Body() body: UpdateSettingsDto,
  ) {
    return this.usersService.updateCurrency(user.sub, body.currency);
  }
}
