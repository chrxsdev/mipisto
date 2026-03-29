import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';
import { AppBaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity({ name: 'income' })
@Index(['userId', 'date'])
export class Income extends AppBaseEntity {
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
  source!: string;

  @Column({ type: 'timestamptz' })
  date!: Date;

  @Column({ default: false })
  isRecurring!: boolean;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @ManyToOne(() => User, (user) => user.incomes, { onDelete: 'CASCADE' })
  user!: User;
}
