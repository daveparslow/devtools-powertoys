module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'react-app', // Uses the recommended rules from @eslint-plugin-react-app
    'plugin:@typescript-eslint/recommended', // Uses the recommended rules from @typescript-eslint/eslint-plugin
    'plugin:prettier/recommended',
  ],
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    // Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
    'prettier/prettier': 'error',
  },
};
