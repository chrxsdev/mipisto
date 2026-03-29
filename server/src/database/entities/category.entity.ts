import { Column, Entity, Index, ManyToOne, OneToMany, Unique } from 'typeorm';
import { AppBaseEntity } from './base.entity';
import { Expense } from './expense.entity';
import { User } from './user.entity';

@Entity({ name: 'categories' })
@Unique(['userId', 'name'])
@Index(['userId', 'name'])
export class Category extends AppBaseEntity {
  @Column({ type: 'varchar', length: 50, nullable: true })
  userId!: string | null;

  @Column()
  name!: string;

  @Column({ default: 'tag' })
  icon!: string;

  @Column({ default: '#6366f1' })
  color!: string;

  @Column({ default: false })
  isDefault!: boolean;

  @ManyToOne(() => User, (user) => user.categories, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  user!: User | null;

  @OneToMany(() => Expense, (expense) => expense.category)
  expenses!: Expense[];
}
