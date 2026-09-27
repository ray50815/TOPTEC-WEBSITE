import globals from 'globals';

const sharedRules = {
  'eqeqeq': ['error', 'always'],
  'no-eval': 'error',
  'no-implied-eval': 'error',
  'no-new-func': 'error',
  'no-script-url': 'error',
  'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
  'no-undef': 'error',
  'prefer-const': 'error'
};

export default [
  {
    ignores: ['dist/**', 'graphify-out/**', 'node_modules/**', '.lighthouseci/**']
  },
  {
    files: ['assets/js/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: globals.browser
    },
    rules: sharedRules
  },
  {
    files: ['sw.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: globals.serviceworker
    },
    rules: sharedRules
  },
  {
    files: ['scripts/**/*.mjs', 'playwright.config.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node
    },
    rules: sharedRules
  },
  {
    files: ['tests/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser }
    },
    rules: sharedRules
  }
];
