var gulp = require('gulp');
var rimraf = require('rimraf').sync;
var _ = require('lodash');

const packagePath = 'packages/socrata-components';

module.exports = () => {
  var packageMappings = {
    'src/js/components/**/*.js': `${packagePath}/components`,
    'src/js/components/**/*.scss': `${packagePath}/components`,
    'src/js/common/**/*.js': `${packagePath}/common`,
    'src/scss/**/*.scss': `${packagePath}/styles`,
    'dist/fonts/*': `${packagePath}/dist/fonts`,
    'dist/js/**/*.{js,map}': `${packagePath}/dist/js`,
    'dist/css/*': `${packagePath}/dist/css`
  };

  // Remove everything except the package.json
  rimraf(`${packagePath}/!(package.json)`);

  // Use the packageMappings to map things in src and dist to the package
  _.each(packageMappings, (dest, src) => {
    gulp.src(src).pipe(gulp.dest(dest));
  });
};
