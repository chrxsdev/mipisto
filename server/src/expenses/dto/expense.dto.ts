import { Transform } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { PaymentMethod } from '../../common/enums/payment-method.enum';
import { parseCalendarDate } from '../../common/utils/date.utils';

export class ExpenseDto {
  @IsString()
  @MinLength(1, { message: 'El nombre es obligatorio' })
  name!: string;

  @IsNumber()
  @Min(0.01, { message: 'El monto debe ser positivo' })
  amount!: number;

  @IsString()
  categoryId!: string;

  @Transform(({ value }) => parseCalendarDate(value))
  @IsDate()
  date!: Date;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @IsOptional()
  @IsString()
  creditCardId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
