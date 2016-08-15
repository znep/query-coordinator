var banner = require('./helpers/banner.js');
var browsers = require('./helpers/browsers.js')();
var gulp = require('gulp');
var includePaths = require('./helpers/includePaths.js')();

var autoprefixer = require('gulp-autoprefixer');
var plumber = require('gulp-plumber');
var prepend = require('gulp-insert').prepend;
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');

module.exports = (done) => {
  gulp.src('docs/stylesheets/prototypes/**/*.scss').
    pipe(sourcemaps.init()).
      pipe(plumber()).
      pipe(sass({ includePaths }).on('error', sass.logError)).
      pipe(prepend(banner())).
      pipe(autoprefixer({ browsers })).
    pipe(sourcemaps.write('.')).
    pipe(gulp.dest('dist/prototypes')).
    on('finish', done);
};
