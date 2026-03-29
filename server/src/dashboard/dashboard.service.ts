import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { endOfDay, startOfYear } from 'date-fns';
import { Repository } from 'typeorm';
import { CreditCardsService } from '../credit-cards/credit-cards.service';
import { CreditCard, Expense, Income, User } from '../database/entities';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Income)
    private readonly incomeRepository: Repository<Income>,
    @InjectRepository(Expense)
    private readonly expensesRepository: Repository<Expense>,
    @InjectRepository(CreditCard)
    private readonly creditCardsRepository: Repository<CreditCard>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly creditCardsService: CreditCardsService,
  ) {}

  private async sumIncomesInRange(userId: string, start: Date, end: Date) {
    const result = await this.incomeRepository
      .createQueryBuilder('income')
      .select('COALESCE(SUM(income.amount), 0)', 'total')
      .where('income.userId = :userId', { userId })
      .andWhere('income.date BETWEEN :start AND :end', { start, end })
      .getRawOne<{ total: string }>();

    return Number(result?.total ?? 0);
  }

  private async sumExpensesInRange(userId: string, start: Date, end: Date) {
    const result = await this.expensesRepository
      .createQueryBuilder('expense')
      .select('COALESCE(SUM(expense.amount), 0)', 'total')
      .where('expense.userId = :userId', { userId })
      .andWhere('expense.date BETWEEN :start AND :end', { start, end })
      .getRawOne<{ total: string }>();

    return Number(result?.total ?? 0);
  }

  async getDashboard(userId: string) {
    const user = await this.usersRepository.findOneByOrFail({ id: userId });
    const today = new Date();
    const start = startOfYear(today);
    const end = endOfDay(today);

    const [totalIncome, totalExpenses, recentExpenses, activeCards] =
      await Promise.all([
        this.sumIncomesInRange(userId, start, end),
        this.sumExpensesInRange(userId, start, end),
        this.expensesRepository.find({
          where: { userId },
          relations: ['category'],
          order: { date: 'DESC' },
          take: 5,
        }),
        this.creditCardsRepository.find({
          where: { userId, isActive: true },
          order: { name: 'ASC' },
        }),
      ]);

    const balance = totalIncome - totalExpenses;

    const creditCardAlerts = await Promise.all(
      activeCards.map(async (card) => ({
        id: card.id,
        name: card.name,
        lastFourDigits: card.lastFourDigits,
        currentSpending: await this.creditCardsService.getCurrentSpending(card),
        monthlyLimit: card.monthlyLimit,
        paymentDueDay: card.paymentDueDay,
      })),
    );

    return {
      totalIncome,
      totalExpenses,
      balance,
      recentExpenses: recentExpenses.map((expense) => ({
        id: expense.id,
        name: expense.name,
        amount: expense.amount,
        date: expense.date,
        categoryName: expense.category.name,
        categoryColor: expense.category.color,
        paymentMethod: expense.paymentMethod,
      })),
      creditCardAlerts,
      currency: user.currency,
    };
  }
}
