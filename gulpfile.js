var gulp = require('gulp');
var rimraf = require('rimraf').sync;
var sourcemaps = require('gulp-sourcemaps');
var plumber = require('gulp-plumber');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var concat = require('gulp-concat');
var paths = [
  ...require('node-bourbon').includePaths,
  ...require('node-neat').includePaths,
  'node_modules/breakpoint-sass/stylesheets',
  'node_modules/modularscale-sass/stylesheets'
]

gulp.task('clean', function() {
  rimraf('dist');
});

gulp.task('copy', function() {
  gulp.src(['src/fonts/**/*']).
    pipe(gulp.dest('dist/fonts'));
});

gulp.task('sass', function() {
  gulp.src('src/scss/styleguide.scss').
    pipe(sourcemaps.init()).
    pipe(plumber()).
    pipe(sass({includePaths: paths}).on('error', sass.logError)).
    pipe(autoprefixer({
      browsers: ['last 2 versions', 'ie >= 10']
    })).
    pipe(sourcemaps.write('.')).
    pipe(gulp.dest('dist/css'));
});

gulp.task('javascript', function() {
  gulp.src(['src/js/**/*.js']).
    pipe(sourcemaps.init()).
    pipe(plumber()).
    pipe(concat('styleguide.js')).
    pipe(sourcemaps.write()).
    pipe(gulp.dest('dist/js'));
});

gulp.task('dist', ['clean', 'copy', 'sass', 'javascript']);
