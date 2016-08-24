const async = require('async');
const gulp = require('gulp');
const _ = require('lodash');
const UglifyJsPlugin = require('webpack').optimize.UglifyJsPlugin;

const webpack = require('gulp-webpack');
const webpackConfig = require('../webpack.config');

function configuration(filename, minify) {
  const isProduction = process.env.NODE_ENV === 'production';
  const devtool = isProduction ? 'source-map' : 'eval';

  return _.merge({}, webpackConfig, {
    devtool,
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
