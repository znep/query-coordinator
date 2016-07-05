var gulp = require('gulp');

var batch = require('gulp-batch');
var watch = require('gulp-watch');

module.exports = () => {
  [
    {path: 'src/js/**/*.js', task: 'javascript'},
    {path: 'src/scss/**/*.scss', task: ['sass']},
    {path: 'src/fonts/**/*.svg', task: 'font'},
    {path: 'src/fonts/templates/*.scss', task: ['font', 'sass']},
    {path: 'docs/stylesheets/**/*.scss', task: ['sass', 'prototypes']}
  ].forEach((assets) => {
    watch(assets.path, batch((events, done) => {
      gulp.start(assets.task, done);
    }));
  });
};
