import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Income } from '../database/entities';
import { IncomeController } from './income.controller';
import { IncomeService } from './income.service';

@Module({
  imports: [TypeOrmModule.forFeature([Income])],
  controllers: [IncomeController],
  providers: [IncomeService],
})
export class IncomeModule {}
