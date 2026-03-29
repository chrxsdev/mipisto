import 'reflect-metadata';
import { Client } from 'pg';

async function run() {
  const host = process.env.DB_HOST ?? 'localhost';
  const port = Number(process.env.DB_PORT ?? '5432');
  const user = process.env.DB_USER ?? 'postgres';
  const password = process.env.DB_PASSWORD ?? 'postgres';
  const database = process.env.DB_NAME ?? 'mipistodb';
  const schema = process.env.DB_SCHEMA ?? 'personal';

  const adminClient = new Client({
    host,
    port,
    user,
    password,
    database: 'postgres',
  });

  await adminClient.connect();
  const dbExists = await adminClient.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [database],
  );

  if (dbExists.rowCount === 0) {
    await adminClient.query(`CREATE DATABASE "${database}"`);
  }

  await adminClient.end();

  const targetClient = new Client({
    host,
    port,
    user,
    password,
    database,
  });

  await targetClient.connect();
  await targetClient.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
  await targetClient.end();

  console.log(`Base de datos ${database} y schema ${schema} listos.`);
}

void run();
