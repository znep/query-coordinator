var fs = require('fs-extra');
var spawn = require('child_process').spawnSync;
var build = require('./build.js');
var paths = require('../config/paths');

build.doBuild(
  // this is the callback called *after* the build completes
  () => {
    // by default, we bump the version with a 'patch'
    var bumpArg = process.argv.slice(2);
    var bump = bumpArg.length === 1 ? bumpArg[0] : 'patch';

    // move to build directory
    try {
      process.chdir(paths.appBuild);
      console.log('Moving build directory...');
    } catch(err) {
      console.error("Couldn't change to build directory; publish failed");
    }

    // bump
    console.log(`Bumping version with '${bump}' in build directory...`)
    var versionBump = spawn('npm', ['version', bump]);
    console.error(versionBump.stderr.toString());
    console.log(`New version: ${versionBump.stdout.toString()}`);

    // publish
    console.log("Publishing package...");
    var publish = spawn('npm', ['publish']);
    console.error(publish.stderr.toString());
    console.log(publish.stdout.toString());

    // only copy if publish succeeds
    if(publish.status === 0) {
      // copy new package.json to package.publish.json in root directory
      console.log("Copying build package.json to root package.publish.json for next publish...")
      fs.copySync('package.json', `${paths.appDirectory}/package.publish.json`);

      console.log('Done!');
      return 0;
    }
  }
);
