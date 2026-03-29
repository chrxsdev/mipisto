import { IsHexColor, IsOptional, IsString, MinLength } from 'class-validator';

export class CategoryDto {
  @IsString()
  @MinLength(1, { message: 'El nombre es obligatorio' })
  name!: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsHexColor({ message: 'Seleccione un color válido' })
  color?: string;
}
