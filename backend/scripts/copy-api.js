import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const sourceDir = join(root, 'api');
const targetDir = join(root, 'dist', 'api');

if (!existsSync(sourceDir)) {
  console.warn('[copy-api] source api directory not found, skipping');
  process.exit(0);
}

mkdirSync(targetDir, { recursive: true });
cpSync(sourceDir, targetDir, { recursive: true });
console.log('[copy-api] copied api/ into dist/api');
