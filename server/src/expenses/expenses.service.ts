import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentMethod } from '../common/enums/payment-method.enum';
import {
  formatMonthYear,
  getCreditExpenseSchedule,
} from '../common/utils/date.utils';
import { Category, CreditCard, Expense } from '../database/entities';
import { CategoriesService } from '../categories/categories.service';
import { ExpenseDto } from './dto/expense.dto';
import { ExpensesQueryDto } from './dto/expenses-query.dto';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expensesRepository: Repository<Expense>,
    @InjectRepository(CreditCard)
    private readonly creditCardsRepository: Repository<CreditCard>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    private readonly categoriesService: CategoriesService,
  ) {}

  private buildExpenseProjection(expense: Expense) {
    if (expense.paymentMethod !== PaymentMethod.CREDIT || !expense.creditCard) {
      return {
        ...expense,
        appliedMonth: expense.date.getMonth() + 1,
        appliedYear: expense.date.getFullYear(),
        appliedMonthLabel: formatMonthYear(expense.date),
        statementCloseDate: null,
        paymentDueDate: null,
        paymentMonthLabel: null,
      };
    }

    const schedule = getCreditExpenseSchedule(
      expense.date,
      expense.creditCard.cutOffDay,
      expense.creditCard.paymentDueDay,
    );

    return {
      ...expense,
      appliedMonth: schedule.appliedMonth,
      appliedYear: schedule.appliedYear,
      appliedMonthLabel: schedule.appliedMonthLabel,
      statementCloseDate: schedule.statementCloseDate,
      paymentDueDate: schedule.paymentDate,
      paymentMonthLabel: schedule.paymentMonthLabel,
    };
  }

  async findAll(userId: string, query: ExpensesQueryDto) {
    const qb = this.expensesRepository
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.category', 'category')
      .leftJoinAndSelect('expense.creditCard', 'creditCard')
      .where('expense.userId = :userId', { userId });

    if (query.categoryId) {
      qb.andWhere('expense.categoryId = :categoryId', {
        categoryId: query.categoryId,
      });
    }

    if (query.paymentMethod) {
      qb.andWhere('expense.paymentMethod = :paymentMethod', {
        paymentMethod: query.paymentMethod,
      });
    }

    const expenses = await qb.orderBy('expense.date', 'DESC').getMany();

    return expenses
      .map((expense) => this.buildExpenseProjection(expense))
      .filter(
        (expense) =>
          (!query.month || expense.appliedMonth === query.month) &&
          (!query.year || expense.appliedYear === query.year),
      );
  }

  private async resolveCreditCard(userId: string, dto: ExpenseDto) {
    if (dto.paymentMethod !== PaymentMethod.CREDIT) {
      return null;
    }

    if (!dto.creditCardId) {
      throw new BadRequestException(
        'La tarjeta de crédito es obligatoria para este gasto',
      );
    }

    const creditCard = await this.creditCardsRepository.findOne({
      where: { id: dto.creditCardId, userId },
    });

    if (!creditCard) {
      throw new BadRequestException('La tarjeta de crédito no es válida');
    }

    return creditCard;
  }

  private async buildPayload(userId: string, dto: ExpenseDto) {
    const category = await this.categoriesService.ensureCategoryOwnership(
      userId,
      dto.categoryId,
    );
    const creditCard = await this.resolveCreditCard(userId, dto);

    return {
      userId,
      name: dto.name.trim(),
      amount: dto.amount,
      categoryId: category.id,
      date: dto.date,
      paymentMethod: dto.paymentMethod,
      creditCardId: creditCard?.id ?? null,
      notes: dto.notes?.trim() || null,
    };
  }

  async create(userId: string, dto: ExpenseDto) {
    const expense = this.expensesRepository.create(
      await this.buildPayload(userId, dto),
    );

    return this.expensesRepository.save(expense);
  }

  async update(userId: string, id: string, dto: ExpenseDto) {
    const expense = await this.expensesRepository.findOne({
      where: { id, userId },
    });

    if (!expense) {
      throw new NotFoundException('Gasto no encontrado');
    }

    Object.assign(expense, await this.buildPayload(userId, dto));

    return this.expensesRepository.save(expense);
  }

  async remove(userId: string, id: string) {
    const expense = await this.expensesRepository.findOne({
      where: { id, userId },
    });

    if (!expense) {
      throw new NotFoundException('Gasto no encontrado');
    }

    await this.expensesRepository.remove(expense);

    return { success: true };
  }
}
