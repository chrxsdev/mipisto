import { Column, Entity, OneToMany } from 'typeorm';
import { AppBaseEntity } from './base.entity';
import { Category } from './category.entity';
import { CreditCard } from './credit-card.entity';
import { Expense } from './expense.entity';
import { Income } from './income.entity';

@Entity({ name: 'users' })
export class User extends AppBaseEntity {
  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column()
  name!: string;

  @Column({ default: 'LPS' })
  currency!: string;

  @Column({ default: 'es-HN' })
  locale!: string;

  @OneToMany(() => Income, (income) => income.user)
  incomes!: Income[];

  @OneToMany(() => Expense, (expense) => expense.user)
  expenses!: Expense[];

  @OneToMany(() => Category, (category) => category.user)
  categories!: Category[];

  @OneToMany(() => CreditCard, (creditCard) => creditCard.user)
  creditCards!: CreditCard[];
}
