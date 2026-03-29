import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

let loaded = false;

export function loadServerEnv() {
  if (loaded) {
    return;
  }

  const envPath = join(process.cwd(), '.env');

  if (!existsSync(envPath)) {
    loaded = true;
    return;
  }

  const content = readFileSync(envPath, 'utf8');

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^(['"])(.*)\1$/, '$2');

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }

  loaded = true;
}
