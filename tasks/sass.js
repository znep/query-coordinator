var async = require('async');
var banner = require('./helpers/banner.js');
var browsers = require('./helpers/browsers.js')();
var gulp = require('gulp');
var includePaths = require('./helpers/includePaths.js')();

var autoprefixer = require('gulp-autoprefixer');
var nano = require('gulp-cssnano');
var plumber = require('gulp-plumber');
var prepend = require('gulp-insert').prepend;
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');

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
