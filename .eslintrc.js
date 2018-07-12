module.exports = {
  parser: 'babel-eslint',
  extends: ['airbnb-base', 'prettier'],
  plugins: ['prettier'],
  globals: {
    Promise: true
  },
  env: {
    jest: true,
    node: true
  },
  rules: {
    'comma-dangle': 'off',
    'import/prefer-default-export': 0,
    'function-paren-newline': ['error', 'consistent'],
    'prettier/prettier': ['error', {
      'singleQuote': true,
      'parser': 'flow'
    }]
  }
};
