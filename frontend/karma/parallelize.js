// Parallel Karma test suite coordinator.
// NOTE: Translations are generated in the Rake task; see parallel_deps
// in lib/tasks/karma_tasks.rake for the easy implementation.

var execFile = require('child_process').execFile;
var fs = require('fs');
var _ = require('lodash');

function getSuiteConf(name) {
  return 'karma/' + name + '/karma.conf.js';
}

// Get all Karma test suites.
var suites = fs.readdirSync('karma').filter(function(path) {
  try {
    // accessSync throws on unreadable files and does nothing otherwise
    return fs.accessSync(getSuiteConf(path), fs.R_OK) || true;
  } catch (err) {
    return false;
  }
});

// A selection of ports based on the number of suites we have.
// This avoids port conflicts, which was causing intermittent
// unexpected test failures when running parallel locally.
var startingPort = 7000;
var ports = _.range(startingPort, startingPort + suites.length);

// Display warning if test suites will
var cpus = require('os').cpus();
console.log('Detected ' + cpus.length + ' cores');
if (cpus.length < suites.length) {
  console.error('Fewer cores than suites to test; consider implementing worker pool');
}

// For launching a Karma test run.
var flags = '--singleRun true --reporters dots'.split(' ');
function generateArgs(suite) {
  return ['start', getSuiteConf(suite), '--port', ports.pop()].concat(flags);
}

// For printing Karma results, with early abort on test failures.
function report(suite) {
  return function(error, stdout, stderr) {
    console.log(suite + ' output:\n' + stdout + '\n error:\n' + stderr);
    if (error) {
      process.exit(1);
    }
  };
}

// Execute test suites in parallel.
var karmaCommand = './node_modules/karma/bin/karma';
suites.forEach(function(suite) {
  console.log('Running Karma tests for ' + suite);
  execFile(karmaCommand, generateArgs(suite), report(suite));
});

console.log('');
