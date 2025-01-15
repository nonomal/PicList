module.exports = {
  root: true,
  globals: {
    __static: 'readonly'
  },
  env: {
    node: true
  },
  parser: 'vue-eslint-parser',
  extends: [
    'plugin:vue/vue3-recommended',
    '@vue/standard',
    '@vue/typescript/recommended',
    '@vue/eslint-config-prettier'
  ],
  plugins: ['@typescript-eslint'],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'off' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    indent: 'off',
    'no-async-promise-executor': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/indent': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/ban-ts-comment': [
      'error',
      {
        'ts-expect-error': 'allow-with-description',
        'ts-nocheck': 'allow-with-description'
      }
    ],
    'vue/no-v-html': 'off',
    'prettier/prettier': [
      'error',
      {},
      {
        usePrettierrc: true
      }
    ]
  },
  parserOptions: {
    parser: '@typescript-eslint/parser'
  },
  overrides: [
    {
      files: ['*.ts', '*.vue'],
      rules: {
        'no-undef': 'off' // https://typescript-eslint.io/docs/linting/troubleshooting/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
      }
    }
  ],
  ignorePatterns: ['src/**/*.d.ts']
}
