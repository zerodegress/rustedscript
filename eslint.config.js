import eslintConfigPrettier from 'eslint-config-prettier'
import js from '@eslint/js'

/** @type */
export default [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    plugins: {},
    rules: {},
  },
  eslintConfigPrettier,
]
