import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentMethod } from '../common/enums/payment-method.enum';
import { getCurrentCycleRange } from '../common/utils/date.utils';
import { CreditCard, Expense } from '../database/entities';
import { CreditCardDto } from './dto/credit-card.dto';

@Injectable()
export class CreditCardsService {
  constructor(
    @InjectRepository(CreditCard)
    private readonly creditCardsRepository: Repository<CreditCard>,
    @InjectRepository(Expense)
    private readonly expensesRepository: Repository<Expense>,
  ) {}

  findAll(userId: string) {
    return this.creditCardsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  findActive(userId: string) {
    return this.creditCardsRepository.find({
      where: { userId, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findOneOwned(userId: string, id: string) {
    const card = await this.creditCardsRepository.findOne({
      where: { id, userId },
    });

    if (!card) {
      throw new NotFoundException('Tarjeta no encontrada');
    }

    return card;
  }

  async getCurrentSpending(card: CreditCard) {
    const { cycleStart, cycleEnd } = getCurrentCycleRange(card.cutOffDay);
    const result = await this.expensesRepository
      .createQueryBuilder('expense')
      .select('COALESCE(SUM(expense.amount), 0)', 'total')
      .where('expense.userId = :userId', { userId: card.userId })
      .andWhere('expense.paymentMethod = :paymentMethod', {
        paymentMethod: PaymentMethod.CREDIT,
      })
      .andWhere('expense.creditCardId = :creditCardId', { creditCardId: card.id })
      .andWhere('expense.date >= :cycleStart', { cycleStart })
      .andWhere('expense.date < :cycleEnd', { cycleEnd })
      .getRawOne<{ total: string }>();

    return Number(result?.total ?? 0);
  }

  async getSpending(userId: string, id: string) {
    const card = await this.findOneOwned(userId, id);

    return {
      ...card,
      currentSpending: await this.getCurrentSpending(card),
    };
  }

  create(userId: string, dto: CreditCardDto) {
    const card = this.creditCardsRepository.create({
      userId,
      name: dto.name.trim(),
      lastFourDigits: dto.lastFourDigits,
      monthlyLimit: dto.monthlyLimit,
      cutOffDay: dto.cutOffDay,
      paymentDueDay: dto.paymentDueDay,
      isActive: dto.isActive ?? true,
    });

    return this.creditCardsRepository.save(card);
  }

  async update(userId: string, id: string, dto: CreditCardDto) {
    const card = await this.findOneOwned(userId, id);

    Object.assign(card, {
      name: dto.name.trim(),
      lastFourDigits: dto.lastFourDigits,
      monthlyLimit: dto.monthlyLimit,
      cutOffDay: dto.cutOffDay,
      paymentDueDay: dto.paymentDueDay,
      isActive: dto.isActive ?? card.isActive,
    });

    return this.creditCardsRepository.save(card);
  }

  async remove(userId: string, id: string) {
    const card = await this.findOneOwned(userId, id);
    const expensesCount = await this.expensesRepository.count({
      where: { userId, creditCardId: id },
    });

    if (expensesCount > 0) {
      throw new BadRequestException(
        'No se puede eliminar esta tarjeta porque tiene gastos asociados. Considere desactivarla en su lugar.',
      );
    }

    await this.creditCardsRepository.remove(card);

    return { success: true };
  }

  async toggle(userId: string, id: string) {
    const card = await this.findOneOwned(userId, id);
    card.isActive = !card.isActive;

    return this.creditCardsRepository.save(card);
  }
}
