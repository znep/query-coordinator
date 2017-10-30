module.exports = {
  // Here we have a problem. This file is shared between frontend, storyteller, and common/karma_config
  // NPM packages. In build scenarios, only one of the 3 packages will have installed its node modules.
  // Node's require() looks for node_modules relative to the _file being run_, which doesn't work here
  // because there is no node_modules entry in common/.
  //
  // Additionally and quite separately, eslint refuses to import modules not starting with
  // eslint-config-*. Our package is called eslint-base. Therefore, we must provide the
  // _full path_ of the json configuration to the "extends" directive, otherwise eslint
  // will fail to load the file.
  "extends": require.resolve('eslint-base/.eslintrc-airbnb.json'),

  "parser": "babel-eslint",
  "plugins": [
    "react",
    "import",
    "mocha"
  ],
  "rules": {
    // These rules are temporary relaxations of our default rules to ease
    // transition. When we have some time, remove as part of EN-18411.
    "no-unused-vars": 0, // This and the next rule are broken by Viz as a form of "documentation". Sigh.
    "no-unused-expressions": 0,
    "no-floating-decimal": 0,
    "import/default": 0,
    "react/prop-types": 0,
    "padded-blocks": 0,
    "max-len": 0,
    "prefer-template": 0,
    "no-use-before-define": 0,
    "eqeqeq": 0,
    "no-shadow": 0,
    "prefer-const": 0,
    "key-spacing": 0,
    "radix": 0,
    "no-useless-escape": 0,
    "no-unneeded-ternary": 0,
    "no-case-declarations": 0,
    "default-case": 0,
    "no-new": 0,
    "prefer-rest-params": 0,
    "no-confusing-arrow": 0,
    "quote-props": 0,
    "no-extend-native": 0,
    "no-loop-func": 0,
    "new-cap": 0,
    //End temporary relaxations

    "react/no-danger": 0,
    "dot-notation": [
      1,
      {
        "allowKeywords": true,
        "allowPattern": "^[a-z]+(_[a-z]+)+$"
      }
    ],
    "mocha/no-exclusive-tests": "error"
  },
  "parserOptions": {
    "ecmaFeatures": {
      "jsx": true
    }
  },
  "globals": {
    "d3": true,
    "Promise": true,
    "L": true,
    "VBArray": true
  }
};
