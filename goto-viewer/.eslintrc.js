module.exports = {
  extends: [
    'react-app', // Use the configuration provided by CRA
    'plugin:prettier/recommended', // Add Prettier integration
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'prettier'],
};
