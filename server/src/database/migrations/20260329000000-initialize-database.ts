import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumnOptions,
  TableForeignKey,
  TableIndex,
  TableUnique,
} from 'typeorm';
import { PaymentMethod } from '../../common/enums/payment-method.enum';

export class InitializeDatabase20260329000000 implements MigrationInterface {
  public readonly name = 'InitializeDatabase20260329000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const schema = this.getSchema(queryRunner);

    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);

    if (!(await queryRunner.hasTable(this.getTablePath(schema, 'users')))) {
      await queryRunner.createTable(
        new Table({
          schema,
          name: 'users',
          columns: this.baseColumns().concat([
            { name: 'email', type: 'varchar', isUnique: true },
            { name: 'password', type: 'varchar' },
            { name: 'name', type: 'varchar' },
            {
              name: 'currency',
              type: 'varchar',
              default: "'LPS'",
            },
            {
              name: 'locale',
              type: 'varchar',
              default: "'es-HN'",
            },
          ]),
        }),
      );
    }

    if (
      !(await queryRunner.hasTable(this.getTablePath(schema, 'categories')))
    ) {
      await queryRunner.createTable(
        new Table({
          schema,
          name: 'categories',
          columns: this.baseColumns().concat([
            {
              name: 'userId',
              type: 'varchar',
              length: '50',
              isNullable: true,
            },
            { name: 'name', type: 'varchar' },
            { name: 'icon', type: 'varchar', default: "'tag'" },
            {
              name: 'color',
              type: 'varchar',
              default: "'#6366f1'",
            },
            {
              name: 'isDefault',
              type: 'boolean',
              default: false,
            },
          ]),
          uniques: [
            new TableUnique({
              name: 'UQ_categories_user_name',
              columnNames: ['userId', 'name'],
            }),
          ],
          indices: [
            new TableIndex({
              name: 'IDX_categories_user_name',
              columnNames: ['userId', 'name'],
            }),
          ],
          foreignKeys: [
            new TableForeignKey({
              name: 'FK_categories_user',
              columnNames: ['userId'],
              referencedSchema: schema,
              referencedTableName: 'users',
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            }),
          ],
        }),
      );
    }

    if (
      !(await queryRunner.hasTable(this.getTablePath(schema, 'credit_cards')))
    ) {
      await queryRunner.createTable(
        new Table({
          schema,
          name: 'credit_cards',
          columns: this.baseColumns().concat([
            { name: 'userId', type: 'varchar', length: '50' },
            { name: 'name', type: 'varchar' },
            { name: 'lastFourDigits', type: 'varchar', length: '4' },
            {
              name: 'monthlyLimit',
              type: 'decimal',
              precision: 12,
              scale: 2,
            },
            { name: 'cutOffDay', type: 'int' },
            { name: 'paymentDueDay', type: 'int' },
            {
              name: 'isActive',
              type: 'boolean',
              default: true,
            },
          ]),
          indices: [
            new TableIndex({
              name: 'IDX_credit_cards_user',
              columnNames: ['userId'],
            }),
          ],
          foreignKeys: [
            new TableForeignKey({
              name: 'FK_credit_cards_user',
              columnNames: ['userId'],
              referencedSchema: schema,
              referencedTableName: 'users',
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            }),
          ],
        }),
      );
    }

    if (!(await queryRunner.hasTable(this.getTablePath(schema, 'income')))) {
      await queryRunner.createTable(
        new Table({
          schema,
          name: 'income',
          columns: this.baseColumns().concat([
            { name: 'userId', type: 'varchar', length: '50' },
            {
              name: 'amount',
              type: 'decimal',
              precision: 12,
              scale: 2,
            },
            { name: 'source', type: 'varchar' },
            { name: 'date', type: 'timestamptz' },
            {
              name: 'isRecurring',
              type: 'boolean',
              default: false,
            },
            {
              name: 'notes',
              type: 'text',
              isNullable: true,
            },
          ]),
          indices: [
            new TableIndex({
              name: 'IDX_income_user_date',
              columnNames: ['userId', 'date'],
            }),
          ],
          foreignKeys: [
            new TableForeignKey({
              name: 'FK_income_user',
              columnNames: ['userId'],
              referencedSchema: schema,
              referencedTableName: 'users',
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            }),
          ],
        }),
      );
    }

    if (!(await queryRunner.hasTable(this.getTablePath(schema, 'expenses')))) {
      await queryRunner.createTable(
        new Table({
          schema,
          name: 'expenses',
          columns: this.baseColumns().concat([
            { name: 'userId', type: 'varchar', length: '50' },
            {
              name: 'amount',
              type: 'decimal',
              precision: 12,
              scale: 2,
            },
            { name: 'name', type: 'varchar' },
            { name: 'categoryId', type: 'varchar', length: '50' },
            { name: 'date', type: 'timestamptz' },
            {
              name: 'paymentMethod',
              type: 'enum',
              enum: Object.values(PaymentMethod),
              enumName: 'expenses_paymentmethod_enum',
            },
            {
              name: 'creditCardId',
              type: 'varchar',
              length: '50',
              isNullable: true,
            },
            {
              name: 'notes',
              type: 'text',
              isNullable: true,
            },
          ]),
          indices: [
            new TableIndex({
              name: 'IDX_expenses_user_date',
              columnNames: ['userId', 'date'],
            }),
            new TableIndex({
              name: 'IDX_expenses_user_category',
              columnNames: ['userId', 'categoryId'],
            }),
            new TableIndex({
              name: 'IDX_expenses_credit_card',
              columnNames: ['creditCardId'],
            }),
          ],
          foreignKeys: [
            new TableForeignKey({
              name: 'FK_expenses_user',
              columnNames: ['userId'],
              referencedSchema: schema,
              referencedTableName: 'users',
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            }),
            new TableForeignKey({
              name: 'FK_expenses_category',
              columnNames: ['categoryId'],
              referencedSchema: schema,
              referencedTableName: 'categories',
              referencedColumnNames: ['id'],
              onDelete: 'RESTRICT',
            }),
            new TableForeignKey({
              name: 'FK_expenses_credit_card',
              columnNames: ['creditCardId'],
              referencedSchema: schema,
              referencedTableName: 'credit_cards',
              referencedColumnNames: ['id'],
              onDelete: 'SET NULL',
            }),
          ],
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const schema = this.getSchema(queryRunner);

    for (const tableName of [
      'expenses',
      'income',
      'credit_cards',
      'categories',
      'users',
    ]) {
      const tablePath = this.getTablePath(schema, tableName);

      if (await queryRunner.hasTable(tablePath)) {
        await queryRunner.dropTable(tablePath, true, true, true);
      }
    }

    await queryRunner.query(
      `DROP TYPE IF EXISTS "${schema}"."expenses_paymentmethod_enum"`,
    );
  }

  private getSchema(queryRunner: QueryRunner) {
    const options = queryRunner.connection.options as { schema?: string };

    return options.schema ?? 'public';
  }

  private getTablePath(schema: string, tableName: string) {
    return `${schema}.${tableName}`;
  }

  private baseColumns(): TableColumnOptions[] {
    return [
      {
        name: 'id',
        type: 'varchar',
        length: '50',
        isPrimary: true,
      },
      {
        name: 'createdAt',
        type: 'timestamptz',
        default: 'now()',
      },
      {
        name: 'updatedAt',
        type: 'timestamptz',
        default: 'now()',
      },
    ];
  }
}
