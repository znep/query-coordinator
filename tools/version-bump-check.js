require('shelljs/global');

if (!which('git')) {
  echo('Sorry, this script requires git');
  exit(1);
}

var masterPackageJSON;
var path = require('path');
var semver = require('semver');
var packagePath = path.resolve('.', 'package.json');
var currentBranchPackageJSON = require(packagePath);

var isNotMaster = exec('git branch | grep "* master"', {silent: true}).stdout.length === 0;
var stashed = exec('git stash', {silent: true}).stdout.indexOf('No local changes to save') === -1;

exec('git checkout master', {silent: true});

// Invalidate the cache for package.json;
delete require.cache[require.resolve(packagePath)];
masterPackageJSON = require(packagePath);

var lessThanMasterVersion = semver.lt(currentBranchPackageJSON.version, masterPackageJSON.version);
var equalToMasterVersion = currentBranchPackageJSON.version === masterPackageJSON.version;
var exitCode = 0;

if (isNotMaster && (lessThanMasterVersion || equalToMasterVersion)) {
  echo('Error: Version discrepancy: ' + currentBranchPackageJSON.version + ' (yours), ' + masterPackageJSON.version + ' (master)');
  echo('=> You must bump the version.');
  echo('=> Version bumps can be completed by editing .version in package.json and bower.json (if it exists).');
  exitCode = 1;
} else {
  echo('You\'re version is good to go!');
  exitCode = 0;
}

exec('git checkout -', {silent: true});
if (stashed) { exec('git stash pop', {silent: true}); }
