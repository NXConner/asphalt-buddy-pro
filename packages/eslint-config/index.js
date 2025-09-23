// Flat config for ESLint 9
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import importPlugin from 'eslint-plugin-import';
import unusedImports from 'eslint-plugin-unused-imports';

export default [
  {
    ignores: ['**/dist/**', '**/.next/**', '**/node_modules/**']
  },
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    plugins: {
      '@typescript-eslint': tseslint,
      react: reactPlugin,
      import: importPlugin,
      'unused-imports': unusedImports
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'unused-imports/no-unused-imports': 'error',
      'react/react-in-jsx-scope': 'off'
    }
  }
];

