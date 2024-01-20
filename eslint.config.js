// @ts-check

import eslintConfigPrettier from 'eslint-config-prettier'
import js from '@eslint/js'

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    plugins: {},
    rules: {},
  },
  eslintConfigPrettier,
]
