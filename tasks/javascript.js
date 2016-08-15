var async = require('async');
var gulp = require('gulp');
var _ = require('lodash');
var UglifyJsPlugin = require('webpack').optimize.UglifyJsPlugin;

var webpack = require('gulp-webpack');
var webpackConfig = require('../webpack.config');

function configuration(filename, minify) {
  return _.merge({}, webpackConfig, {
    output: {
      filename
    },
    plugins: minify ? [new UglifyJsPlugin({ compress: { warnings: false } })] : []
  });
}

function stream(filename, minify) {
  return gulp.src('src/js/index.js').
    pipe(webpack(configuration(filename, minify)));
}

function compileJS(callback) {
  stream('socrata-components.js', false).
    pipe(gulp.dest('dist/js')).
    on('finish', callback);
}

function compileMinifiedJS(callback) {
  stream('socrata-components.min.js', true).
    pipe(gulp.dest('dist/js')).
    on('finish', callback);
}

module.exports = (done) => {
  async.parallel([
    compileJS,
    compileMinifiedJS
  ], done);
};
