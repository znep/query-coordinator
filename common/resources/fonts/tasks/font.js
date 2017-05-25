var async = require('async');
var gulp = require('gulp');

var consolidate = require('gulp-consolidate');
var iconfont = require('gulp-iconfont');

var fontName = 'socrata-icons';
var className = 'icon';
var buildTimestamp = Math.round(Date.now() / 1000);

var path = require('path');
var commonRoot = path.resolve(__dirname, '..', '..', '..');

function commonPath(p) {
  return path.resolve(commonRoot, p);
}

function compileIconStyles(stream) {
  return (callback) => {
    stream.on('glyphs', (glyphs) => {
      var selector = glyphs.map((glyph) => (
        `.${className}-${glyph.name}::before, .socrata-icon-${glyph.name}::before`
      )).join(',\n');

      var locals = {
        className,
        selector,
        glyphs,
        fontName
      };

      gulp.src(commonPath('resources/fonts/templates/socrata-icons.scss')).
        pipe(consolidate('lodash', locals)).
        pipe(gulp.dest('dist')).
        on('finish', callback);
    });
  };
}

function compileFontFamily() {
  return (callback) => {
    var locals = {
      fontName,
      buildTimestamp
    };

    gulp.src(commonPath('resources/fonts/templates/socrata-icons-font-family.scss')).
      pipe(consolidate('lodash', locals)).
      pipe(gulp.dest('dist')).
      on('finish', callback);
  };
}

function compileStream(stream) {
  return (callback) => {
    stream.
      pipe(gulp.dest('dist')).
      on('finish', callback);
  };
}

module.exports = (done) => {
  var settings = {
    fontName: `socrata-icons.${buildTimestamp}`,
    formats: ['eot', 'svg', 'ttf', 'woff', 'woff2'],
    timestamp: buildTimestamp,
    descent: 128 // Magic! Fuck if I know. It works.
  };

  var stream = gulp.src(commonPath('resources/fonts/svg/*.svg')).
    pipe(iconfont(settings));

  async.parallel([
    compileFontFamily(),
    compileIconStyles(stream),
    compileStream(stream)
  ], done);
};
