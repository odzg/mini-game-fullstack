import { includeIgnoreFile } from '@eslint/compat';
import { baseConfig } from '@odzg/eslint-config';
import { defineConfig, globalIgnores } from 'eslint/config';
import path from 'node:path';

export default defineConfig(
  includeIgnoreFile(path.join(import.meta.dirname, '.gitignore')),
  globalIgnores([
    '.nx',
    '**/.next',
    '**/dist',
    '**/node_modules',
    'pnpm-lock.yaml',
  ]),
  ...baseConfig,
);
