import type { Linter } from 'eslint';

import comments from '@eslint-community/eslint-plugin-eslint-comments/configs';
import react from '@eslint-react/eslint-plugin';
import js from '@eslint/js';
import markdown from '@eslint/markdown';
import nextPlugin from '@next/eslint-plugin-next';
import { workspaceRoot } from '@nx/devkit';
import nxPlugin from '@nx/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import deMorgan from 'eslint-plugin-de-morgan';
import { createNodeResolver, importX } from 'eslint-plugin-import-x';
import { jsdoc } from 'eslint-plugin-jsdoc';
import eslintPluginJsonSchemaValidator from 'eslint-plugin-json-schema-validator';
import eslintPluginJsonc from 'eslint-plugin-jsonc';
// @ts-expect-error Currently does not include type declarations
import jsxA11y from 'eslint-plugin-jsx-a11y';
import eslintPluginMath from 'eslint-plugin-math';
import moduleInterop from 'eslint-plugin-module-interop';
import nodePlugin from 'eslint-plugin-n';
import packageJson from 'eslint-plugin-package-json';
import perfectionist from 'eslint-plugin-perfectionist';
// @ts-expect-error Currently does not include type declarations
import pluginPromise from 'eslint-plugin-promise';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import eslintPluginReactRefresh from 'eslint-plugin-react-refresh';
import regexpPlugin from 'eslint-plugin-regexp';
import sonarjs from 'eslint-plugin-sonarjs';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import eslintPluginYml from 'eslint-plugin-yml';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

const GLOB_JS = '**/*.?([cm])js';
const GLOB_JSON = '**/*.json?(c)';
const GLOB_PACKAGE_JSON = '**/package.json';
const GLOB_TS = '**/*.?([cm])ts?(x)';
const GLOB_WEB_TS_JS = 'apps/web/**/*.?([cm])[jt]s?(x)';
const GLOB_YML = '**/*.y?(a)ml';

export const baseConfig = defineConfig(
  {
    extends: nxPlugin.configs['flat/base'],
    name: '@nx/eslint-plugin',
  },
  {
    extends: ['js/recommended'],
    files: [GLOB_JS, GLOB_TS],
    name: js.meta.name,
    plugins: { js },
  },
  {
    extends: [
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    files: [GLOB_JS, GLOB_TS],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: workspaceRoot,
      },
    },
    name: tseslint.plugin.meta.name,
  },
  jsdoc({
    config: 'flat/recommended-typescript-error',
    files: [GLOB_TS],
  }),
  jsdoc({
    config: 'flat/recommended-typescript-flavor-error',
    files: [GLOB_JS],
  }),
  comments.recommended as Linter.Config,
  {
    extends: [
      ...eslintPluginJsonc.configs['flat/recommended-with-jsonc'],
      ...eslintPluginJsonc.configs['flat/prettier'],
    ],
    files: [GLOB_JSON],
    name: eslintPluginJsonc.meta.name,
  },
  {
    files: [GLOB_JSON],
    ignores: [GLOB_PACKAGE_JSON],
    name: `${eslintPluginJsonc.meta.name}/sort-keys-except-package-json`,
    rules: {
      'jsonc/sort-keys': 'error',
    },
  },
  {
    extends: eslintPluginJsonSchemaValidator.configs['flat/recommended'],
    files: [GLOB_JSON, GLOB_YML],
    name: eslintPluginJsonSchemaValidator.meta.name,
  },
  markdown.configs.recommended,
  {
    ...nodePlugin.configs['flat/recommended'],
    files: [GLOB_JS, GLOB_TS],
  },
  {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- No type declaration
    ...(pluginPromise.configs['flat/recommended'] as Linter.Config),
    files: [GLOB_JS, GLOB_TS],
  },
  {
    // Temporary name until the plugin is updated to include names in its exported configs
    name: `${perfectionist.meta?.name ?? ''}/recommended-natural`,
    ...perfectionist.configs['recommended-natural'],
    files: [GLOB_JS, GLOB_TS],
  },
  {
    extends: [
      ...eslintPluginYml.configs['flat/recommended'],
      ...eslintPluginYml.configs['flat/prettier'],
    ],
    files: [GLOB_YML],
    name: eslintPluginYml.meta.name,
  },
  {
    extends: [
      // @ts-expect-error Currently incompatible types
      importX.flatConfigs.recommended,
      // @ts-expect-error Currently incompatible types
      importX.flatConfigs.typescript,
    ],
    files: [GLOB_JS, GLOB_TS],
    settings: {
      'import-x/resolver-next': [
        createTypeScriptImportResolver(),
        createNodeResolver(),
      ],
    },
  },
  {
    // Temporary name until the plugin is updated to include names in its exported configs
    name: `${reactHooks.meta.name}/recommended`,
    ...reactHooks.configs.flat.recommended,
    files: [GLOB_JS, GLOB_TS],
  },
  {
    extends: [
      reactPlugin.configs.flat.recommended,
      reactPlugin.configs.flat['jsx-runtime'],
    ],
    files: [GLOB_JS, GLOB_TS],
    name: 'eslint-plugin-react',
  },
  {
    ...react.configs['recommended-type-checked'],
    files: [GLOB_JS, GLOB_TS],
  },
  {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- No type declaration
    ...(jsxA11y.flatConfigs.recommended as Linter.Config),
    files: [GLOB_JS, GLOB_TS],
  },
  {
    ...eslintPluginReactRefresh.configs.next,
    files: [GLOB_JS, GLOB_TS],
  },
  {
    ...eslintPluginUnicorn.configs.recommended,
    files: [GLOB_JS, GLOB_TS],
  },
  {
    extends: [sonarjs.configs.recommended],
    files: [GLOB_JS, GLOB_TS],
  },
  {
    // Temporary name until the plugin is updated to include names in its exported configs
    name: 'eslint-plugin-regexp/flat/recommended',
    ...regexpPlugin.configs['flat/recommended'],
    files: [GLOB_JS, GLOB_TS],
  },
  {
    // Temporary name until the plugin is updated to include names in its exported configs
    name: `${deMorgan.meta.name}/recommended`,
    ...deMorgan.configs.recommended,
    files: [GLOB_JS, GLOB_TS],
  },
  {
    // Temporary name until the plugin is updated to include names in its exported configs
    name: `${eslintPluginMath.meta.name}/recommended`,
    ...eslintPluginMath.configs.recommended,
    files: [GLOB_JS, GLOB_TS],
  },
  {
    // Temporary name until the plugin is updated to include names in its exported configs
    name: `${moduleInterop.meta.name}/recommended`,
    ...moduleInterop.configs.recommended,
    files: [GLOB_JS, GLOB_TS],
  },
  packageJson.configs.recommended,
  {
    ...nextPlugin.configs['core-web-vitals'],
    files: [GLOB_WEB_TS_JS],
  },
  eslintConfigPrettier,
  {
    linterOptions: {
      reportUnusedInlineConfigs: 'error',
    },
    name: 'base-config',
    rules: {
      '@eslint-community/eslint-comments/require-description': 'error',
    },
  },
  {
    files: [GLOB_JS, GLOB_TS],
    name: 'js-and-ts-files-config',
    rules: {
      '@nx/enforce-module-boundaries': 'error',
      '@typescript-eslint/array-type': ['error', { default: 'generic' }],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-empty-object-type': [
        'error',
        { allowInterfaces: 'with-single-extends' },
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      'import-x/default': 'off',
      'import-x/named': 'off',
      'import-x/namespace': 'off',
      'import-x/newline-after-import': 'error',
      'import-x/no-duplicates': ['error', { 'prefer-inline': true }],
      'import-x/no-named-as-default-member': 'off',
      'jsdoc/require-jsdoc': 'off',
      'n/no-missing-import': 'off',
      'no-console': ['error', { allow: ['error'] }],
      'perfectionist/sort-imports': [
        'error',
        {
          tsconfig: {
            rootDir: '.',
          },
        },
      ],
      'unicorn/no-null': 'off',
      'unicorn/prevent-abbreviations': [
        'error',
        { ignore: [/env/i, /props$/i, /params$/i] },
      ],
    },
  },
  {
    files: [GLOB_JSON],
    name: 'json-files-config',
    rules: {
      '@nx/dependency-checks': 'error',
    },
  },
  {
    files: ['apps/api/src/utils/shell/**/*'],
    name: 'shell-util-files',
    rules: {
      'sonarjs/no-os-command-from-path': 'off',
      'sonarjs/os-command': 'off',
    },
  },
);
