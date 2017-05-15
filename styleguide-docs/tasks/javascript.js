const gulp = require('gulp');
const webpack = require('webpack');
const webpackStream = require('webpack-stream');

const socrataComponentsConfig = require('../webpack/socrata-components.config');

function compileJS(callback) {
  gulp.src('src/js/index.js').
    pipe(webpackStream(socrataComponentsConfig, webpack)).
    pipe(gulp.dest('dist/js')).
    on('finish', callback);
}

module.exports = compileJS;
