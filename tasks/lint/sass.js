var gulp = require('gulp');
var stylelint = require('gulp-stylelint');

var configuration = {
  reporters: [
    {formatter: 'string', console: true}
  ]
};

module.exports = () => {
  return gulp.src('src/scss/**/*.scss').
    pipe(stylelint(configuration));
};
