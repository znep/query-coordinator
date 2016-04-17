var gulp = require('gulp');

gulp.task('clean', require('./tasks/clean.js'));
gulp.task('copy', require('./tasks/copy.js'));
gulp.task('font', require('./tasks/font.js'));
gulp.task('javascript', require('./tasks/javascript.js'));
gulp.task('sass', ['font'], require('./tasks/sass.js'));
gulp.task('watch', require('./tasks/watch.js'));

gulp.task('dist', ['clean', 'copy', 'sass', 'javascript', 'font']);
gulp.task('default', ['dist']);
