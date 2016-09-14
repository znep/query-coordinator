require('shelljs/global');

// We don't any unexpected output to muddy up our console.
config.silent = true;

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

pushd(baseDirectory);

var isNotMaster = exec('git rev-parse --abbrev-ref HEAD').stdout !== 'master';
var stash = exec('git stash -u');
var stashed = stash.stdout.indexOf('No local changes to save') === -1;

if (stash.code !== 0) {
  exit(1);
}

var fetch = exec('git fetch --all');

if (fetch.code === 0) {
  var checkout = exec('git checkout origin/master');

  if (checkout.code === 0) {

    // Invalidate the cache for package.json;
    delete require.cache[require.resolve(packagePath)];
    masterPackageJSON = require(packagePath);

    var exitCode = 0;
    var lessThanMasterVersion = semver.lt(currentBranchPackageJSON.version, masterPackageJSON.version);
    var equalToMasterVersion = currentBranchPackageJSON.version === masterPackageJSON.version;

    if (isNotMaster && (lessThanMasterVersion || equalToMasterVersion)) {
      echo('Error: Version discrepancy: ' + currentBranchPackageJSON.version + ' (yours), ' + masterPackageJSON.version + ' (master)');
      echo('=> You must bump the version.');
      echo('=> Version bumps can be completed by editing .version in package.json.');
      exitCode = 1;
    } else {
      echo('Your version is good to go!');
      exitCode = 0;
    }

    exec('git checkout -');
  }
}

if (stashed) { exec('git stash pop'); }

popd();
exit(exitCode);
