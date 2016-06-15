var gulp = require('gulp');
var eslint = require('gulp-eslint');

var sources = [
  'src/**/*.js',
  'tasks/**/*.js',
  'gulpfile.js'
];

var configuration = {
  extends: 'eslint:recommended',
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

module.exports = () => {
  return gulp.src(sources).
    pipe(eslint(configuration)).
    pipe(eslint.format());
};
