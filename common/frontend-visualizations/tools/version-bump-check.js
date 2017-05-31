require('shelljs/global');

// Don't log the output of the exec commands.
config.silent = true;

// Let's err on the pessimistic side!
var exitCode = 1;

if (!which('git')) {
  echo('Sorry, this script requires git');
  exit(exitCode);
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
  echo('Stashing failed: ' + stash.stderr);
  exit(exitCode);
}

var fetch = exec('git fetch --all');

if (fetch.code === 0) {
  var checkout = exec('git checkout origin/master');

  if (checkout.code === 0) {

    // Invalidate the cache for package.json;
    delete require.cache[require.resolve(packagePath)];

    // To support a platform-ui directory structure before merge, we have to
    // refresh the packagePath instead of using the one calculated while in the
    // monorepo branch.
    packagePath = path.join(__dirname, '..', 'package.json');
    masterPackageJSON = require(packagePath);

    var lessThanMasterVersion = semver.lt(currentBranchPackageJSON.version, masterPackageJSON.version);
    var equalToMasterVersion = currentBranchPackageJSON.version === masterPackageJSON.version;

    if (isNotMaster && (lessThanMasterVersion || equalToMasterVersion)) {
      echo('Error: Version discrepancy: ' + currentBranchPackageJSON.version + ' (yours), ' + masterPackageJSON.version + ' (master)');
      echo('=> You must bump the version.');
      echo('=> Version bumps can be completed by editing .version in package.json.');
    } else {
      echo('Your version is good to go!');
      exitCode = 0;
    }

    exec('git checkout -');

  } else {
    echo('Checking out origin/master failed: ' + checkout.stderr);
  }
} else {
  echo('Fetching failed: ' + fetch.stderr);
}

if (stashed) { exec('git stash pop'); }

popd();
exit(exitCode);
