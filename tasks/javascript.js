var banner = require('./helpers/banner.js');
var gulp = require('gulp');

var prepend = require('gulp-insert').prepend;
var rename = require('gulp-rename');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var webpack = require('gulp-webpack');

var configuration = {
  context: __dirname,
  entry: '../src/js/index.js',
  output: {
    path: `${__dirname}/dist/js`,
    filename: 'styleguide.js',
    libraryTarget: 'umd',
    library: 'styleguide'
  },
  resolve: {
    modulesDirectories: ['node_modules']
  }
};

module.exports = () => {
  gulp.src('src/js/**/*.js').
    pipe(webpack(configuration)).
    pipe(sourcemaps.init()).
    pipe(prepend(banner())).
    pipe(sourcemaps.write()).
    pipe(gulp.dest('dist/js')).
    pipe(uglify({preserveComments: 'license'})).
    pipe(rename('styleguide.min.js')).
    pipe(sourcemaps.write()).
    pipe(gulp.dest('dist/js'));
};
