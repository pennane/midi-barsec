import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json'
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        alert: 'readonly',
        requestAnimationFrame: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-inferrable-types': 'error',
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-unused-vars': 'off',
      'prefer-const': 'warn',
      'no-var': 'error'
    }
  },
  {
    ignores: ['dist/', 'node_modules/', '*.config.js']
  }
] 