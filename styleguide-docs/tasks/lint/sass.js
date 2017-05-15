var gulp = require('gulp');
var stylelint = require('gulp-stylelint');

var configuration = {
  failAfterError: true,
  reporters: [
    { formatter: 'string', console: true }
  ]
};

module.exports = () => gulp.src('src/scss/**/*.scss').
  pipe(stylelint(configuration));
