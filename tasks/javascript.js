var async = require('async');
var gulp = require('gulp');
var UglifyJsPlugin = require('webpack').optimize.UglifyJsPlugin;

var webpack = require('gulp-webpack');

function configuration(filename, minify) {
  return {
    context: __dirname,
    devtool: 'source-map',
    entry: '../src/js/index.js',
    externals: {
      'react': {
        root: 'React',
        commonjs2: 'react',
        commonjs: 'react',
        amd: 'react'
      }
    },
    output: {
      path: `${__dirname}/dist/js`,
      filename,
      libraryTarget: 'umd',
      library: 'styleguide'
    },
    resolve: {
      modulesDirectories: ['node_modules']
    },
    module: {
      loaders: [
        {
          loader: 'babel',
          test: /\.js$/g,
          exclude: /node_modules/g,
          query: {
            presets: ['es2015', 'react']
          }
        }
      ]
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
