var gulp = require('gulp');

gulp.task('clean', require('./tasks/clean.js'));
gulp.task('copy', require('./tasks/copy.js'));
gulp.task('font', require('./tasks/font.js'));

gulp.task('javascript', require('./tasks/javascript.js'));
gulp.task('javascript/lint', require('./tasks/lint/javascript.js'));

gulp.task('prototypes', ['font'], require('./tasks/prototypes.js'));

gulp.task('sass', ['font'], require('./tasks/sass.js'));
gulp.task('sass/lint', require('./tasks/lint/sass.js'));

gulp.task('watch', ['default'], require('./tasks/watch.js'));

gulp.task('lint', ['sass/lint', 'javascript/lint']);
gulp.task('dist', ['clean', 'copy', 'font', 'sass', 'prototypes', 'javascript']);
gulp.task('default', ['dist']);
