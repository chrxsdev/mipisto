import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { PaymentMethod } from '../../common/enums/payment-method.enum';

export class ExpensesQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;
}
