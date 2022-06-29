module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: "module",
  },
  extends: ["eslint:recommended", "google"],
  rules: {
    "no-unused-vars": "warn",
    "comma-dangle": "off",
    "no-async-promise-executor": "off",
    "max-len": "off",
    "quote-props": "off",
    quotes: "off",
    indent: "off",
    "object-curly-spacing": "off",
  },
};
