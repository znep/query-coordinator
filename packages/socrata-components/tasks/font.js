var async = require('async');
var gulp = require('gulp');

var consolidate = require('gulp-consolidate');
var iconfont = require('gulp-iconfont');

var fontName = 'socrata-icons';
var className = 'icon';
var buildTimestamp = Math.round(Date.now() / 1000);

var path = require('path');
var commonRoot = path.resolve(__dirname, '../../../common');

function commonPath(p) {
  return path.resolve(commonRoot, p);
}

function compileIconErb(stream) {
  return (callback) => {
    stream.on('glyphs', (glyphs) => {
      var locals = {
        className: 'socrata-icon',
        glyphs
      };

      gulp.src(commonPath('components/fonts/templates/_icons.erb')).
        pipe(consolidate('lodash', locals)).
        pipe(gulp.dest('pages/elements')).
        on('finish', callback);
    });
  };
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

      gulp.src(commonPath('components/fonts/templates/socrata-icons.scss')).
        pipe(consolidate('lodash', locals)).
        pipe(gulp.dest('dist/fonts')).
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

    gulp.src(commonPath('components/fonts/templates/socrata-icons-font-family.scss')).
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
    fontName: `socrata-icons.${buildTimestamp}`,
    formats: ['eot', 'svg', 'ttf', 'woff', 'woff2'],
    timestamp: buildTimestamp,
    descent: 128 // Magic! Fuck if I know. It works.
  };

  var stream = gulp.src(commonPath('components/fonts/svg/*.svg')).
    pipe(iconfont(settings));

  async.parallel([
    compileFontFamily(),
    compileIconStyles(stream),
    compileIconErb(stream),
    compileStream(stream)
  ], done);
};