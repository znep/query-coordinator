module.exports = {
  "env": {
    "browser": true
  },
  "extends": "eslint:recommended",
  "rules": {
    "brace-style": [
      2,
      "1tbs",
      {
      "allowSingleLine": true
      }
    ],
    "camelcase": [1, {"properties": "never"}],
    "consistent-return": 0,
    "dot-location": [
      1,
      "object"
    ],
    "dot-notation": [
      1,
      {
      "allowKeywords": false,
      "allowPattern": "^[a-z]+(_[a-z]+)+$"
      }
    ],
    "eol-last": 1,
    "indent": [
      2,
      2,
      {
        "SwitchCase": 1
      }
    ],
    "new-cap": [
      1,
      {
      "newIsCapExceptions": [
        "pbf"
      ]
      }
    ],
    "no-console": 0,
    "no-extend-native": 2,
    "no-extra-semi": 1,
    "no-shadow": [
      2,
      {
      "hoist": "all"
      }
    ],
    "no-spaced-func": 2,
    "no-trailing-spaces": 2,
    "no-underscore-dangle": 0,
    "no-unused-vars": 1,
    "no-use-before-define": 0,
    "quotes": [
      1,
      "single",
      "avoid-escape"
    ],
    "quote-props": [
      2,
      "as-needed",
      {
      "keywords": false,
      "unnecessary": false
      }
    ],
    "semi": [
      2,
      "always"
    ],
    "keyword-spacing": 2,
    "space-before-blocks": [
      2,
      "always"
    ],
    "space-before-function-paren": [
      2,
      "never"
    ],
    "space-infix-ops": 2,
    "strict": 0
  },
  "globals": {
    "$": true
  }
};
