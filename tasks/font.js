var async = require('async');
var gulp = require('gulp');

var consolidate = require('gulp-consolidate');
var iconfont = require('gulp-iconfont');

function compileCSS(stream) {
  return (callback) => {
    stream.on('glyphs', (glyphs) => {
      var className = 'icon';
      var selector = glyphs.map((glyph) => {
        return `.${className}-${glyph.name}:before`;
      }).join(',\n');

      var locals = {
        className,
        selector,
        glyphs,
        fontName: 'socrata-icons',
        fontPath: '../fonts/'
      };

      gulp.src('src/fonts/templates/socrata-icons.css').
        pipe(consolidate('lodash', locals)).
        pipe(gulp.dest('src/scss')).
        on('finish', callback);
    });
  };
}

function compileStream(stream) {
  return (callback) => {
    stream.
      pipe(gulp.dest('dist/fonts')).
      on('finish', callback);
  };
}

module.exports = (done) => {
  var settings = {
    fontName: 'socrata-icons',
    formats: ['eot', 'svg', 'ttf', 'woff', 'woff2'],
    timestamp: Math.round(Date.now() / 1000),
    descent: 128 // Magic! Fuck if I know. It works.
  };

  var stream = gulp.src('src/fonts/svg/*.svg').
    pipe(iconfont(settings));

  async.parallel([
    compileCSS(stream),
    compileStream(stream)
  ], done);
};
