import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category, User } from '../database/entities';
import { UserSettingsController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Category])],
  controllers: [UserSettingsController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
