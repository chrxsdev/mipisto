import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { DEFAULT_CATEGORIES } from '../database/default-categories';
import { Category, User } from '../database/entities';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  private resolveLocale(currency: string) {
    return currency === 'USD' ? 'en-US' : 'es-HN';
  }

  async ensureEmailAvailable(email: string) {
    const existingUser = await this.usersRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }
  }

  async createUser(input: { email: string; password: string; name: string }) {
    await this.ensureEmailAvailable(input.email);

    const user = this.usersRepository.create({
      email: input.email.toLowerCase(),
      password: input.password,
      name: input.name.trim(),
      currency: 'LPS',
      locale: 'es-HN',
    });

    const savedUser = await this.usersRepository.save(user);
    const globalCategories = await this.categoriesRepository.find({
      where: { userId: IsNull(), isDefault: true },
    });

    const categoriesToClone =
      globalCategories.length > 0
        ? globalCategories.map((category) =>
            this.categoriesRepository.create({
              userId: savedUser.id,
              name: category.name,
              icon: category.icon,
              color: category.color,
              isDefault: false,
            }),
          )
        : DEFAULT_CATEGORIES.map((category) =>
            this.categoriesRepository.create({
              userId: savedUser.id,
              ...category,
              isDefault: false,
            }),
          );

    await this.categoriesRepository.save(categoriesToClone);

    return savedUser;
  }

  async findByEmail(email: string) {
    return this.usersRepository.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  async findById(id: string) {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async getSettings(userId: string) {
    const user = await this.findById(userId);

    return {
      currency: user.currency,
      locale: user.locale,
    };
  }

  async updateCurrency(userId: string, currency: string) {
    const user = await this.findById(userId);
    user.currency = currency;
    user.locale = this.resolveLocale(currency);

    const savedUser = await this.usersRepository.save(user);

    return {
      currency: savedUser.currency,
      locale: savedUser.locale,
    };
  }
}
