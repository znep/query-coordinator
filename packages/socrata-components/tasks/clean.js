var rimraf = require('rimraf').sync;

module.exports = () => {
  rimraf('dist');
  rimraf('components');
  rimraf('styles');
  rimraf('common');
};
