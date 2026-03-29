import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { parseCalendarDate } from '../../common/utils/date.utils';

export class IncomeDto {
  @IsString()
  @MinLength(1, { message: 'La fuente es obligatoria' })
  source!: string;

  @IsNumber()
  @Min(0.01, { message: 'El monto debe ser positivo' })
  amount!: number;

  @Transform(({ value }) => parseCalendarDate(value))
  @IsDate()
  date!: Date;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}
