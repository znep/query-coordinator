// Parallel Karma test suite coordinator.
// NOTE: Translations are generated in the Rake task; see parallel_deps
// in lib/tasks/karma_tasks.rake for the easy implementation.

var cp = require('child_process');
var fs = require('fs');

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

// Display warning if test suites will
var cpus = require('os').cpus();
console.log('Detected ' + cpus.length + ' cores');
if (cpus.length < suites.length) {
  console.error('Fewer cores than suites to test; consider implementing worker pool');
}

// For launching a Karma test run.
var flags = '--singleRun true --browsers PhantomJS --reporters dots'.split(' ');
function generateArgs(suite) {
  return ['start', getSuiteConf(suite)].concat(flags);
}

// For printing Karma results, with early abort on test failures.
function report(suite) {
  return function(err, stdout, stderr) {
    console.log(suite + ' output:\n' + stdout);
    if (err) {
      process.exit(1);
    }
  };
}

// Execute test suites in parallel.
var karmaCommand = './node_modules/karma/bin/karma';
suites.forEach(function(suite) {
  console.log('Running Karma tests for ' + suite);
  cp.execFile(karmaCommand, generateArgs(suite), report(suite));
});
console.log('');
