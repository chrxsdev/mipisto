import { IsBoolean, IsNumber, IsOptional, IsString, Matches, Max, Min, MinLength } from 'class-validator';

export class CreditCardDto {
  @IsString()
  @MinLength(1, { message: 'El nombre es obligatorio' })
  name!: string;

  @IsString()
  @Matches(/^\d{4}$/, { message: 'Los últimos 4 dígitos deben ser numéricos' })
  lastFourDigits!: string;

  @IsNumber()
  @Min(0.01, { message: 'El límite mensual debe ser positivo' })
  monthlyLimit!: number;

  @IsNumber()
  @Min(1)
  @Max(31)
  cutOffDay!: number;

  @IsNumber()
  @Min(1)
  @Max(31)
  paymentDueDay!: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
