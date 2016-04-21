var gulp = require('gulp');

var batch = require('gulp-batch');
var watch = require('gulp-watch');

module.exports = () => {
  [
    {path: 'src/js/**/*.js', task: 'javascript'},
    {path: 'src/scss/**/*.scss', task: 'sass'},
    {path: 'src/fonts/**/*.svg', task: 'font'},
    {path: 'src/fonts/templates/socrata-icons.css', task: ['font', 'sass']},
    {path: 'docs/stylesheets/prototypes/**/*.scss', task: 'prototypes'}
  ].forEach((assets) => {
    watch(assets.path, batch((events, done) => {
      gulp.start(assets.task, done);
    }));
  });
};
