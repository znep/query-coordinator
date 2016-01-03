var gulp = require('gulp');

var rimraf = require('rimraf').sync;
var sourcemaps = require('gulp-sourcemaps');
var plumber = require('gulp-plumber');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var nano = require('gulp-cssnano');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var prepend = require('gulp-insert').prepend;

var package = require('./package.json');

var includePaths = [
  ...require('node-bourbon').includePaths,
  ...require('node-neat').includePaths,
  'node_modules/breakpoint-sass/stylesheets',
  'node_modules/modularscale-sass/stylesheets'
]

var browsers = [
  'last 2 versions',
  'ie >= 10'
];

var banner = [
  '/*!',
  ` * Socrata Styleguide v${package.version}`,
  ` * Copyright 2015-${(new Date).getFullYear()} ${package.author}`,
  ` * Licensed under ${package.license}`,
  ' */\n\n'
].join('\n');

gulp.task('clean', function() {
  rimraf('dist');
});

gulp.task('copy', function() {
  gulp.src('src/fonts/**/*').
    pipe(gulp.dest('dist/fonts'));
});

gulp.task('sass', function() {
  gulp.src('src/scss/**/*.scss').
    pipe(sourcemaps.init()).
      pipe(plumber()).
      pipe(sass({includePaths}).on('error', sass.logError)).
      pipe(prepend(banner)).
      pipe(autoprefixer({browsers})).
    pipe(sourcemaps.write()).
    pipe(gulp.dest('dist/css'));

  gulp.src('src/scss/**/*.scss').
    pipe(sourcemaps.init()).
      pipe(plumber()).
      pipe(sass({includePaths}).on('error', sass.logError)).
      pipe(prepend(banner)).
      pipe(autoprefixer({browsers})).
      pipe(nano({discardComments: {removeAllButFirst: true}})).
      pipe(rename('styleguide.min.css')).
    pipe(sourcemaps.write()).
    pipe(gulp.dest('dist/css'));
});

gulp.task('javascript', function() {
  gulp.src('src/js/**/*.js').
    pipe(sourcemaps.init()).
    pipe(concat('styleguide.js')).
    pipe(prepend(banner)).
    pipe(sourcemaps.write()).
    pipe(gulp.dest('dist/js')).
    pipe(uglify({preserveComments: 'license'})).
    pipe(rename('styleguide.min.js')).
    pipe(sourcemaps.write()).
    pipe(gulp.dest('dist/js'));
});

gulp.task('dist', ['clean', 'copy', 'sass', 'javascript']);
gulp.task('default', ['dist']);
