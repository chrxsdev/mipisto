import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  formatMonthYear,
  getCreditExpenseSchedule,
  getMonthRange,
} from '../common/utils/date.utils';
import { CreditCard, Expense, Income } from '../database/entities';
import { PaymentMethod } from '../common/enums/payment-method.enum';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Expense)
    private readonly expensesRepository: Repository<Expense>,
    @InjectRepository(Income)
    private readonly incomeRepository: Repository<Income>,
    @InjectRepository(CreditCard)
    private readonly creditCardsRepository: Repository<CreditCard>,
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

  async getAnalytics(userId: string, query: AnalyticsQueryDto) {
    const [rawExpenses, incomes, cards] = await Promise.all([
      this.expensesRepository.find({
        where: { userId },
        relations: ['category', 'creditCard'],
        order: { date: 'ASC' },
      }),
      this.incomeRepository.find({
        where: { userId },
        order: { date: 'ASC' },
      }),
      this.creditCardsRepository.find({
        where: { userId },
        order: { name: 'ASC' },
      }),
    ]);

    const expenses = rawExpenses
      .map((expense) => this.buildExpenseProjection(expense))
      .filter(
        (expense) =>
          (!query.month || expense.appliedMonth === query.month) &&
          (!query.year || expense.appliedYear === query.year),
      );

    const filteredIncomes = incomes.filter((income) => {
      const incomeMonth = income.date.getMonth() + 1;
      const incomeYear = income.date.getFullYear();

      return (
        (!query.month || incomeMonth === query.month) &&
        (!query.year || incomeYear === query.year)
      );
    });

    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0,
    );
    const categoryTotals = new Map<
      string,
      { id: string; name: string; color: string; total: number }
    >();

    expenses.forEach((expense) => {
      const current = categoryTotals.get(expense.category.id) ?? {
        id: expense.category.id,
        name: expense.category.name,
        color: expense.category.color,
        total: 0,
      };

      current.total += expense.amount;
      categoryTotals.set(expense.category.id, current);
    });

    const creditCardUsage = cards.map((card) => {
      const spending = expenses
        .filter((expense) => expense.creditCardId === card.id)
        .reduce((sum, expense) => sum + expense.amount, 0);

      return {
        id: card.id,
        name: card.name,
        lastFourDigits: card.lastFourDigits,
        monthlyLimit: card.monthlyLimit,
        spending,
      };
    });

    const filteredDates = [
      ...expenses.map((expense) => expense.statementCloseDate ?? expense.date),
      ...filteredIncomes.map((income) => income.date),
    ].sort((left, right) => left.getTime() - right.getTime());

    const fallbackRange =
      query.month && query.year
        ? getMonthRange(query.month, query.year)
        : query.year
          ? {
              start: new Date(query.year, 0, 1),
              end: new Date(query.year, 11, 31, 23, 59, 59, 999),
            }
          : { start: new Date(), end: new Date() };

    return {
      startDate: filteredDates[0] ?? fallbackRange.start,
      endDate: filteredDates[filteredDates.length - 1] ?? fallbackRange.end,
      expenses,
      incomes: filteredIncomes,
      categoryBreakdown: Array.from(categoryTotals.values()).map((item) => ({
        ...item,
        percentage: totalExpenses > 0 ? (item.total / totalExpenses) * 100 : 0,
      })),
      creditCardUsage,
    };
  }
}
