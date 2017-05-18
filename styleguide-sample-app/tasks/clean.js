var rimraf = require('rimraf').sync;

module.exports = () => {
  rimraf('dist');
  rimraf('build');
};
