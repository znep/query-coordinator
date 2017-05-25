var gulp = require('gulp');

gulp.task('clean', require('./tasks/clean.js'));
gulp.task('font', require('./tasks/font.js'));
gulp.task('default', ['clean', 'font']);

