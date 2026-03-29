import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { buildTypeOrmOptions } from './typeorm.config';
import { loadServerEnv } from './load-env';

loadServerEnv();

export default new DataSource(buildTypeOrmOptions(process.env));
