var gulp = require('gulp');
var eslint = require('gulp-eslint');

var sources = [
  'src/**/*.js',
  'tasks/**/*.js',
  'gulpfile.js'
];

var configuration = {
  env: {
    browser: true,
    node: true
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 6
  }
};

module.exports = () => {
  return gulp.src(sources).
    pipe(eslint(configuration)).
    pipe(eslint.format());
};
