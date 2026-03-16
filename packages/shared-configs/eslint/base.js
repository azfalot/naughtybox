/** @type { import("eslint").Linter.Config } */
module.exports = {
  root: true,
  env: { node: true, es2022: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  ignorePatterns: ['node_modules/', 'dist/', '.angular/'],
  overrides: [
    {
      files: ['*.ts'],
      extends: ['eslint:recommended'],
      rules: {},
    },
  ],
};
