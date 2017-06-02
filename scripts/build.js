// Do this as the first thing so that any code reading it knows the right env.
process.env.NODE_ENV = 'production';

// Load environment variables from .env file. Suppress warnings using silent
// if this file is missing. dotenv will never modify any environment variables
// that have already been set.
// https://github.com/motdotla/dotenv
require('dotenv').config({silent: true});

var chalk = require('chalk');
var fs = require('fs-extra');
var path = require('path');
var pathExists = require('path-exists');
var filesize = require('filesize');
var gzipSize = require('gzip-size').sync;
var webpack = require('webpack');
var config = require('../config/webpack.config.prod');
var paths = require('../config/paths');
var checkRequiredFiles = require('react-dev-utils/checkRequiredFiles');
var recursive = require('recursive-readdir');
var stripAnsi = require('strip-ansi');

var useYarn = pathExists.sync(paths.yarnLockFile);

// Warn and crash if required files are missing
if (!checkRequiredFiles([paths.appHtml, paths.appIndexJs])) {
  process.exit(1);
}

// Input: /User/dan/app/build/static/js/main.82be8.js
// Output: /js/main.js
function removeFileNameHash(fileName) {
  return fileName
    .replace(paths.appBuild, '')
    .replace(/\/?(.*)(\.\w+)(\.js|\.css)/, (match, p1, p2, p3) => p1 + p3);
}

// Input: 1024, 2048
// Output: "(+1 KB)"
function getDifferenceLabel(currentSize, previousSize) {
  var FIFTY_KILOBYTES = 1024 * 50;
  var difference = currentSize - previousSize;
  var fileSize = !Number.isNaN(difference) ? filesize(difference) : 0;
  if (difference >= FIFTY_KILOBYTES) {
    return chalk.red('+' + fileSize);
  } else if (difference < FIFTY_KILOBYTES && difference > 0) {
    return chalk.yellow('+' + fileSize);
  } else if (difference < 0) {
    return chalk.green(fileSize);
  } else {
    return '';
  }
}

// if we're passed "run" then we just do the build, otherwise we're being used by another script
var startBuild = process.argv.slice(2).indexOf('run') >= 0;
if(startBuild) {
  doBuild();
}

// First, read the current file sizes in build directory.
// This lets us display how much they changed later.
function doBuild(onComplete) {
  recursive(paths.appBuild, (err, fileNames) => {
    var previousSizeMap = (fileNames || [])
      .filter(fileName => /\.(js|css)$/.test(fileName))
      .reduce((memo, fileName) => {
        var contents = fs.readFileSync(fileName);
        var key = removeFileNameHash(fileName);
        memo[key] = gzipSize(contents);
        return memo;
      }, {});

    // Remove all content but keep the directory so that
    // if you're in it, you don't end up in Trash
    fs.emptyDirSync(paths.appBuild);

    // Copy the package used for actually publishing
    fs.copySync(`${paths.appDirectory}/package.publish.json`, `${paths.appBuild}/package.json`);

    // Start the webpack build
    build(previousSizeMap, onComplete);
  });
}

// Print a detailed summary of build files.
function printFileSizes(stats, previousSizeMap) {
  var assets = stats.toJson().assets
    .filter(asset => /\.(js|css)$/.test(asset.name))
    .map(asset => {
      var fileContents = fs.readFileSync(paths.appBuild + '/' + asset.name);
      var size = gzipSize(fileContents);
      var previousSize = previousSizeMap[removeFileNameHash(asset.name)];
      var difference = getDifferenceLabel(size, previousSize);
      return {
        folder: path.join('build', path.dirname(asset.name)),
        name: path.basename(asset.name),
        size: size,
        sizeLabel: filesize(size) + (difference ? ' (' + difference + ')' : '')
      };
    });
  assets.sort((a, b) => b.size - a.size);
  var longestSizeLabelLength = Math.max.apply(null,
    assets.map(a => stripAnsi(a.sizeLabel).length)
  );
  assets.forEach(asset => {
    var sizeLabel = asset.sizeLabel;
    var sizeLength = stripAnsi(sizeLabel).length;
    if (sizeLength < longestSizeLabelLength) {
      var rightPadding = ' '.repeat(longestSizeLabelLength - sizeLength);
      sizeLabel += rightPadding;
    }
    console.log(
      '  ' + sizeLabel +
      '  ' + chalk.dim(asset.folder + path.sep) + chalk.cyan(asset.name)
    );
  });
}

// Print out errors
function printErrors(summary, errors) {
  console.log(chalk.red(summary));
  console.log();
  errors.forEach(err => {
    console.log(err.message || err);
    console.log();
  });
}

// Create the production build and print the deployment instructions.
function build(previousSizeMap, onComplete) {
  console.log('Creating an optimized production build...');
  webpack(config).run((err, stats) => {
    if (err) {
      printErrors('Failed to compile.', [err]);
      process.exit(1);
    }

    if (stats.compilation.errors.length) {
      printErrors('Failed to compile.', stats.compilation.errors);
      process.exit(1);
    }

    if (process.env.CI && stats.compilation.warnings.length) {
     printErrors('Failed to compile.', stats.compilation.warnings);
     process.exit(1);
   }

    console.log(chalk.green('Compiled successfully.'));
    console.log();

    console.log('File sizes after gzip:');
    console.log();
    printFileSizes(stats, previousSizeMap);
    console.log();

    var openCommand = process.platform === 'win32' ? 'start' : 'open';
    var appPackage  = require(paths.appPackageJson);
    var homepagePath = appPackage.homepage;
    var publicPath = config.output.publicPath;

    // only print this message if we're running build alone and not from another script
    if (startBuild) {
      console.log('The ' + chalk.cyan('build') + ' folder is ready to be published.');
      console.log();
      console.log('  ' + chalk.cyan('cd') +  ' build');
      console.log('  ' + chalk.cyan('npm') +  ' version major/minor/patch');
      console.log('  ' + chalk.cyan('npm') +  ' publish');
      console.log();
    }

    if (onComplete) {
      onComplete();
    }
  });
}

function copyPublicFolder() {
  fs.copySync(paths.appPublic, paths.appBuild, {
    dereference: true,
    filter: file => file !== paths.appHtml
  });
}

module.exports = {
  doBuild
}
