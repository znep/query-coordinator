var async = require('async');
var banner = require('./helpers/banner.js');
var gulp = require('gulp');

var autoprefixer = require('gulp-autoprefixer');
var nano = require('gulp-cssnano');
var plumber = require('gulp-plumber');
var prepend = require('gulp-insert').prepend;
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');

var includePaths = [
  ...require('node-bourbon').includePaths,
  ...require('node-neat').includePaths,
  'node_modules/breakpoint-sass/stylesheets',
  'node_modules/modularscale-sass/stylesheets'
];

var browsers = [
  'last 2 versions',
  'ie >= 10'
];

function stream() {
  return gulp.src('src/scss/**/*.scss').
    pipe(sourcemaps.init()).
      pipe(plumber()).
      pipe(sass({includePaths}).on('error', sass.logError)).
      pipe(prepend(banner())).
      pipe(autoprefixer({browsers}));
}

function compileCSS(callback) {
  stream().
    pipe(sourcemaps.write()).
    pipe(gulp.dest('dist/css')).
    on('finish', callback);
}

function compileNanoCSS(callback) {
  stream().
    pipe(nano({discardComments: {removeAllButFirst: true}})).
    pipe(rename('styleguide.min.css')).
  pipe(sourcemaps.write()).
  pipe(gulp.dest('dist/css')).
  on('finish', callback);
}

module.exports = (done) => {
  async.parallel([
    compileCSS,
    compileNanoCSS
  ], done);
};
