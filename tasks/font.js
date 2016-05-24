var async = require('async');
var gulp = require('gulp');

var consolidate = require('gulp-consolidate');
var iconfont = require('gulp-iconfont');

var fontName = 'socrata-icons';

function compileIconStyles(stream) {
  return (callback) => {
    stream.on('glyphs', (glyphs) => {
      var className = 'icon';
      var selector = glyphs.map((glyph) => {
        return `.${className}-${glyph.name}::before`;
      }).join(',\n');

      var locals = {
        className,
        selector,
        glyphs,
        fontName
      };

      gulp.src('src/fonts/templates/socrata-icons.scss').
        pipe(consolidate('lodash', locals)).
        pipe(gulp.dest('dist/fonts')).
        on('finish', callback);
    });
  };
}

function compileFontFamily() {
  return (callback) => {
    var locals = {
      fontName
    };

    gulp.src('src/fonts/templates/socrata-icons-font-family.scss').
      pipe(consolidate('lodash', locals)).
      pipe(gulp.dest('dist/fonts')).
      on('finish', callback);
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
    compileFontFamily(),
    compileIconStyles(stream),
    compileStream(stream)
  ], done);
};
