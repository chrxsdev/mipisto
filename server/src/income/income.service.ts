import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Income } from '../database/entities';
import { IncomeDto } from './dto/income.dto';
import { IncomeQueryDto } from './dto/income-query.dto';

@Injectable()
export class IncomeService {
  constructor(
    @InjectRepository(Income)
    private readonly incomeRepository: Repository<Income>,
  ) {}

  async findAll(userId: string, query: IncomeQueryDto) {
    const qb = this.incomeRepository
      .createQueryBuilder('income')
      .where('income.userId = :userId', { userId });

    if (query.month) {
      qb.andWhere('EXTRACT(MONTH FROM income.date) = :month', {
        month: query.month,
      });
    }

    if (query.year) {
      qb.andWhere('EXTRACT(YEAR FROM income.date) = :year', {
        year: query.year,
      });
    }

    return qb.orderBy('income.date', 'DESC').getMany();
  }

  create(userId: string, dto: IncomeDto) {
    const income = this.incomeRepository.create({
      userId,
      source: dto.source.trim(),
      amount: dto.amount,
      date: dto.date,
      isRecurring: dto.isRecurring ?? false,
      notes: dto.notes?.trim() || null,
    });

    return this.incomeRepository.save(income);
  }

  async update(userId: string, id: string, dto: IncomeDto) {
    const income = await this.incomeRepository.findOne({ where: { id, userId } });

    if (!income) {
      throw new NotFoundException('Ingreso no encontrado');
    }

    Object.assign(income, {
      source: dto.source.trim(),
      amount: dto.amount,
      date: dto.date,
      isRecurring: dto.isRecurring ?? false,
      notes: dto.notes?.trim() || null,
    });

    return this.incomeRepository.save(income);
  }

  async remove(userId: string, id: string) {
    const income = await this.incomeRepository.findOne({ where: { id, userId } });

    if (!income) {
      throw new NotFoundException('Ingreso no encontrado');
    }

    await this.incomeRepository.remove(income);

    return { success: true };
  }
}
