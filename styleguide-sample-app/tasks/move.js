var gulp = require('gulp');
var rename = require('gulp-rename');
var merge = require('merge-stream');

module.exports = () => {
  return merge(
    gulp.src('../packages/socrata-components/dist/js/**/*').
      pipe(gulp.dest('dist/js')),
    gulp.src('../packages/socrata-components/dist/css/**/*').
      pipe(gulp.dest('dist/css')),
    gulp.src('../packages/socrata-components/dist/fonts/socrata-icons*').
      pipe(rename(function(path) {
        return path.basename = path.basename.replace(/.\d+/, ''); // Chop off cachebust.
      })).
      pipe(gulp.dest('dist/fonts')),
    gulp.src('../packages/socrata-components/dist/fonts/**/*').
      pipe(gulp.dest('dist/fonts'))
  );
};
