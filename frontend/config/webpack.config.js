/*eslint-env node */
const process = require('process');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');

const webpackConfigDirectory = path.resolve(__dirname, 'webpack');

const CONFIG_FILE_SUFFIX = '.config.js';
const configFileNameForBundle = (bundleName) =>
  path.resolve(webpackConfigDirectory, `${bundleName}${CONFIG_FILE_SUFFIX}`);

const userSpecifiedBundles = _.chain(process.env.FRONTEND_WEBPACK_BUNDLES || '').
  split(',').
  map(_.trim).
  filter('length').
  value();

_.each(userSpecifiedBundles, (bundleName) => {
  const configFileName = configFileNameForBundle(bundleName);
  if (!fs.existsSync(configFileName)) {
    console.error(`Expected to find: ${configFileName} because you specified ${bundleName}, but no such file found.`);
    process.exit(1);
  }
});

function isWebpackConfig(filename) {
  return _.endsWith(filename, CONFIG_FILE_SUFFIX);
}

function shouldBuild(filename) {
  const basename = path.basename(filename, '.config.js');
  return _.isEmpty(userSpecifiedBundles) || _.includes(userSpecifiedBundles, basename);
}

function getRequirePath(webpackConfig) {
  return path.resolve(__dirname, 'webpack', webpackConfig);
}

const configFilesToBuild = fs.readdirSync(webpackConfigDirectory).
  filter(isWebpackConfig).
  filter(shouldBuild).
  map(getRequirePath);

console.log('=== Active webpack configurations ===');
console.log(configFilesToBuild.join('\n'));
console.log('=== End active webpack configurations ===');

module.exports = configFilesToBuild.
  map(require);
