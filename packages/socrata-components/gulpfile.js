var gulp = require('gulp');

gulp.task('clean', require('./tasks/clean.js'));
gulp.task('font', require('./tasks/font.js'));

gulp.task('javascript', require('./tasks/javascript.js'));

gulp.task('sass', ['font'], require('./tasks/sass.js'));

gulp.task('move', ['javascript', 'sass', 'font'], require('./tasks/move.js'));

gulp.task('dist', ['clean', 'font', 'sass', 'javascript', 'move']);
gulp.task('default', ['dist']);

