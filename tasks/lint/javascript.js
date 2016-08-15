var gulp = require('gulp');
var eslint = require('gulp-eslint');

var sources = [
  'src/**/*.js',
  'tasks/**/*.js',
  'gulpfile.js'
];

var configuration = {
  'extends': `${__dirname}/../../node_modules/eslint-base/.eslintrc-airbnb.json`,
  env: {
    browser: true,
    node: true
  },
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  }
};

module.exports = () => gulp.src(sources).
  pipe(eslint(configuration)).
  pipe(eslint.format()).
  pipe(eslint.failAfterError());
