import { ConfigService } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';
import { InitializeDatabase20260329000000 } from './migrations/20260329000000-initialize-database';
import { Category, CreditCard, Expense, Income, User } from './entities';

export function buildTypeOrmOptions(
  configService: ConfigService | Record<string, string | undefined>,
): DataSourceOptions {
  const get = (key: string, fallback?: string) => {
    if (configService instanceof ConfigService) {
      return configService.get<string>(key) ?? fallback;
    }

    return configService[key] ?? fallback;
  };

  return {
    type: 'postgres',
    host: get('DB_HOST', 'localhost'),
    port: Number(get('DB_PORT', '5432')),
    username: get('DB_USER', 'postgres'),
    password: get('DB_PASSWORD', ''),
    database: get('DB_NAME', 'mipistodb'),
    schema: get('DB_SCHEMA', 'personal'),
    entities: [User, Income, Expense, Category, CreditCard],
    migrations: [InitializeDatabase20260329000000],
    migrationsRun: true,
    synchronize: false,
  };
}
