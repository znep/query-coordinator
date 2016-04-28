var gulp = require('gulp');

module.exports = () => {
  gulp.src('node_modules/tether-shepherd/dist/js/shepherd.min.js').
    pipe(gulp.dest('dist/js/vendor'));
  gulp.src('node_modules/tether/dist/js/tether.min.js').
    pipe(gulp.dest('dist/js/vendor'));
};

