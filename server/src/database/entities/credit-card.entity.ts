import { Column, Entity, Index, ManyToOne, OneToMany } from 'typeorm';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';
import { AppBaseEntity } from './base.entity';
import { Expense } from './expense.entity';
import { User } from './user.entity';

@Entity({ name: 'credit_cards' })
@Index(['userId'])
export class CreditCard extends AppBaseEntity {
  @Column({ type: 'varchar', length: 50 })
  userId!: string;

  @Column()
  name!: string;

  @Column({ length: 4 })
  lastFourDigits!: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  monthlyLimit!: number;

  @Column({ type: 'int' })
  cutOffDay!: number;

  @Column({ type: 'int' })
  paymentDueDay!: number;

  @Column({ default: true })
  isActive!: boolean;

  @ManyToOne(() => User, (user) => user.creditCards, { onDelete: 'CASCADE' })
  user!: User;

  @OneToMany(() => Expense, (expense) => expense.creditCard)
  expenses!: Expense[];
}
