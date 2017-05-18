var gulp = require('gulp');
var rimraf = require('rimraf').sync;
var _ = require('lodash');
var merge = require('merge-stream');

const packagePath = 'dist';

var path = require('path');
var commonRoot = path.resolve(__dirname, '../../../common');

module.exports = () => {

  // Build the legacy path structure still used by consumers
  // of the npm artifact.
  // This is messy, but we'll be getting rid of this as soon
  // as we can.
  return merge(
    gulp.
      src(path.resolve(commonRoot, 'components/') + '/**/*.js').
      pipe(gulp.dest('components')),
    gulp.
      src(path.resolve(commonRoot, 'styleguide') + '/**/*.scss').
      pipe(gulp.dest('styles')),
    gulp.
      src(path.resolve(commonRoot, 'components/') + '/**/*.scss').
      pipe(gulp.dest('components')),
    gulp.
      src(commonRoot + '/*.js').
      pipe(gulp.dest('common')),
    gulp.
      src(commonRoot + '/locales/*').
      pipe(gulp.dest('common/locales')),
    gulp.
      src(path.resolve(commonRoot, 'components/fonts/svg') + '/*').
      pipe(gulp.dest('dist/fonts/svg'))
  );
};
