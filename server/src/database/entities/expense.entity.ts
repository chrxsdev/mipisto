import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { PaymentMethod } from '../../common/enums/payment-method.enum';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';
import { AppBaseEntity } from './base.entity';
import { Category } from './category.entity';
import { CreditCard } from './credit-card.entity';
import { User } from './user.entity';

@Entity({ name: 'expenses' })
@Index(['userId', 'date'])
@Index(['userId', 'categoryId'])
@Index(['creditCardId'])
export class Expense extends AppBaseEntity {
  @Column({ type: 'varchar', length: 50 })
  userId!: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  amount!: number;

  @Column()
  name!: string;

  @Column({ type: 'varchar', length: 50 })
  categoryId!: string;

  @Column({ type: 'timestamptz' })
  date!: Date;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  paymentMethod!: PaymentMethod;

  @Column({ type: 'varchar', length: 50, nullable: true })
  creditCardId!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @ManyToOne(() => User, (user) => user.expenses, { onDelete: 'CASCADE' })
  user!: User;

  @ManyToOne(() => Category, (category) => category.expenses, {
    onDelete: 'RESTRICT',
  })
  category!: Category;

  @ManyToOne(() => CreditCard, (creditCard) => creditCard.expenses, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  creditCard!: CreditCard | null;
}
