require('shelljs/global');

if (!which('git')) {
  echo('Sorry, this script requires git');
  exit(1);
}

var masterPackageJSON;
var path = require('path');
var semver = require('semver');
var packagePath = path.join(__dirname, '..', 'package.json');
var baseDirectory = path.join(__dirname, '..');
var currentBranchPackageJSON = require(packagePath);

pushd(baseDirectory, {silent: true});

var isNotMaster = exec('git rev-parse --abbrev-ref HEAD', {silent: true}).stdout !== 'master';
var stashed = exec('git stash -u', {silent: true}).stdout.indexOf('No local changes to save') === -1;

exec('git checkout master', {silent: true});

// Invalidate the cache for package.json;
delete require.cache[require.resolve(packagePath)];
masterPackageJSON = require(packagePath);

var exitCode = 0;
var lessThanMasterVersion = semver.lt(currentBranchPackageJSON.version, masterPackageJSON.version);
var equalToMasterVersion = currentBranchPackageJSON.version === masterPackageJSON.version;

if (isNotMaster && (lessThanMasterVersion || equalToMasterVersion)) {
  echo('Error: Version discrepancy: ' + currentBranchPackageJSON.version + ' (yours), ' + masterPackageJSON.version + ' (master)');
  echo('=> You must bump the version.');
  echo('=> Version bumps can be completed by editing .version in package.json and bower.json (if it exists).');
  exitCode = 1;
} else {
  echo('Your version is good to go!');
  exitCode = 0;
}

exec('git checkout -', {silent: true});
if (stashed) { exec('git stash pop', {silent: true}); }

popd();
exit(exitCode);
