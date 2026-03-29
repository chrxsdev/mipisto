import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Category, Expense } from '../database/entities';
import { CategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    @InjectRepository(Expense)
    private readonly expensesRepository: Repository<Expense>,
  ) {}

  async findAll(userId: string) {
    const categories = await this.categoriesRepository.find({
      where: [{ userId }, { userId: IsNull(), isDefault: true }],
      order: { name: 'ASC' },
    });

    const counts = await this.expensesRepository
      .createQueryBuilder('expense')
      .select('expense.categoryId', 'categoryId')
      .addSelect('COUNT(*)', 'count')
      .where('expense.userId = :userId', { userId })
      .groupBy('expense.categoryId')
      .getRawMany<{ categoryId: string; count: string }>();

    const countsMap = new Map(
      counts.map((item) => [item.categoryId, Number(item.count)]),
    );

    return categories.map((category) => ({
      ...category,
      _count: {
        expenses: countsMap.get(category.id) ?? 0,
      },
    }));
  }

  async create(userId: string, dto: CategoryDto) {
    await this.ensureUniqueName(userId, dto.name);

    const category = this.categoriesRepository.create({
      userId,
      name: dto.name.trim(),
      icon: dto.icon?.trim() || 'tag',
      color: dto.color ?? '#6366f1',
      isDefault: false,
    });

    return this.categoriesRepository.save(category);
  }

  async update(userId: string, id: string, dto: CategoryDto) {
    const category = await this.categoriesRepository.findOne({
      where: { id, userId },
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    await this.ensureUniqueName(userId, dto.name, id);

    Object.assign(category, {
      name: dto.name.trim(),
      icon: dto.icon?.trim() || category.icon || 'tag',
      color: dto.color ?? category.color,
    });

    return this.categoriesRepository.save(category);
  }

  async remove(userId: string, id: string) {
    const category = await this.categoriesRepository.findOne({
      where: { id, userId },
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    const expensesCount = await this.expensesRepository.count({
      where: { userId, categoryId: id },
    });

    if (expensesCount > 0) {
      throw new BadRequestException(
        'No se puede eliminar una categoría que tiene gastos asociados',
      );
    }

    await this.categoriesRepository.remove(category);

    return { success: true };
  }

  async ensureCategoryOwnership(userId: string, categoryId: string) {
    const category = await this.categoriesRepository.findOne({
      where: [{ id: categoryId, userId }, { id: categoryId, userId: IsNull() }],
    });

    if (!category) {
      throw new BadRequestException('La categoría seleccionada no es válida');
    }

    return category;
  }

  private async ensureUniqueName(
    userId: string,
    name: string,
    excludedCategoryId?: string,
  ) {
    const existingCategory = await this.categoriesRepository
      .createQueryBuilder('category')
      .where('category.userId = :userId', { userId })
      .andWhere('LOWER(category.name) = LOWER(:name)', { name: name.trim() })
      .andWhere(
        excludedCategoryId ? 'category.id != :excludedCategoryId' : '1 = 1',
        { excludedCategoryId },
      )
      .getOne();

    if (existingCategory) {
      throw new ConflictException('Ya existe una categoría con ese nombre');
    }
  }
}
