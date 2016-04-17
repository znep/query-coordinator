var _ = require('lodash');
var gulp = require('gulp');

var rimraf = require('rimraf').sync;
var async = require('async');
var sourcemaps = require('gulp-sourcemaps');
var plumber = require('gulp-plumber');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var nano = require('gulp-cssnano');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var prepend = require('gulp-insert').prepend;
var watch = require('gulp-watch');
var batch = require('gulp-batch');
var iconfont = require('gulp-iconfont');
var webpack = require('gulp-webpack');
var consolidate = require('gulp-consolidate');

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
  gulp.src('node_modules/tether-shepherd/dist/js/shepherd.min.js').
    pipe(gulp.dest('dist/js/vendor'));

  gulp.src('node_modules/tether/dist/js/tether.min.js').
    pipe(gulp.dest('dist/js/vendor'));
});

gulp.task('font', function(done) {
  var stream = gulp.src('src/fonts/svg/*.svg').
    pipe(iconfont({
      fontName: 'socrata-icons',
      formats: ['eot', 'svg', 'ttf', 'woff', 'woff2'],
      timestamp: Math.round(Date.now() / 1000),
      descent: 128 // Magic! Fuck if I know. It works.
    }));

    async.parallel([
      function(callback) {
        stream.on('glyphs', function(glyphs) {
          var className = 'icon';
          var selector = _.map(glyphs, function(glyph) {
            return '.' + className + '-' + glyph.name + ':before';
          }).join(',\n');

          gulp.src('src/fonts/templates/socrata-icons.css').
            pipe(consolidate('lodash', {
              className,
              selector,
              glyphs,
              fontName: 'socrata-icons',
              fontPath: '../fonts/'
            })).
            pipe(gulp.dest('src/scss')).
            on('finish', callback);
        });
      },
      function(callback) {
        stream.
          pipe(gulp.dest('dist/fonts')).
          on('finish', callback);
      }
    ], done);
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
    pipe(webpack({
      context: __dirname,
      entry: './src/js/index.js',
      output: {
        path: __dirname + '/dist/js',
        filename: 'styleguide.js',
        libraryTarget: 'umd',
        library: 'styleguide'
      },
      resolve: {
        modulesDirectories: ['node_modules']
      }
    })).
    pipe(sourcemaps.init()).
    pipe(prepend(banner)).
    pipe(sourcemaps.write()).
    pipe(gulp.dest('dist/js')).
    pipe(uglify({preserveComments: 'license'})).
    pipe(rename('styleguide.min.js')).
    pipe(sourcemaps.write()).
    pipe(gulp.dest('dist/js'));
});

gulp.task('watch', function() {
  [
    {path: 'src/js/**/*.js', task: 'javascript'},
    {path: 'src/scss/**/*.scss', task: 'sass'},
    {path: 'src/fonts/**/*.svg', task: 'font'},
    {path: 'src/fonts/templates/socrata-icons.css', task: 'font'}
  ].forEach(function(assets) {
    watch(assets.path, batch(function(events, done) {
      gulp.start(assets.task, done);
    }));
  });
});

gulp.task('dist', ['clean', 'copy', 'sass', 'javascript', 'font']);
gulp.task('default', ['dist']);
