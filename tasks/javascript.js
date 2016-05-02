var async = require('async');
var gulp = require('gulp');
var UglifyJsPlugin = require('webpack').optimize.UglifyJsPlugin;

var prepend = require('gulp-insert').prepend;
var rename = require('gulp-rename');
var sourcemaps = require('gulp-sourcemaps');
var webpack = require('gulp-webpack');

function configuration(filename, minify) {
  return {
    context: __dirname,
    devtool: 'source-map',
    entry: '../src/js/index.js',
    output: {
      path: `${__dirname}/dist/js`,
      filename,
      libraryTarget: 'umd',
      library: 'styleguide'
    },
    resolve: {
      modulesDirectories: ['node_modules']
    },
    plugins: minify ? [new UglifyJsPlugin({compress: {warnings: false}})] : []
  };
}

function stream(filename, minify) {
  return gulp.src('src/js/**/*.js').
    pipe(webpack(configuration(filename, minify)));
}

function compileJS(callback) {
  stream('styleguide.js', false).
    pipe(gulp.dest('dist/js')).
    on('finish', callback);
}

function compileMinifiedJS(callback) {
  stream('styleguide.min.js', true).
    pipe(gulp.dest('dist/js')).
    on('finish', callback);
}

module.exports = (done) => {
  async.parallel([
    compileJS,
    compileMinifiedJS
  ], done);
};
