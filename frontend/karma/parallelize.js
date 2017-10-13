// Parallel Karma test suite coordinator.
// NOTE: Translations are generated in the Rake task; see parallel_deps
// in lib/tasks/karma_tasks.rake for the easy implementation.

var exec = require('child_process').exec;
var fs = require('fs');
var _ = require('lodash');

function getSuiteConf(name) {
  return `karma/${name}/karma.conf.js`;
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
const startingPort = 7000;
let numUsedPorts = 0;
const nextPort = () => (startingPort + numUsedPorts++);

// Display warning if there are fewer CPU cores than parallel test suites.
var cpus = require('os').cpus();
console.log(`Detected ${cpus.length} cores`);
if (cpus.length < suites.length) {
  console.error('Fewer cores than suites to test; consider implementing worker pool');
}

// For launching a Karma test run.
function generateArgs(suite) {
  return `start ${getSuiteConf(suite)} --port ${nextPort()} --singleRun true --reporters dots`;
}

// For printing Karma results, with early abort on test failures.
function report(suite) {
  return function(error, stdout, stderr) {
    function printStreamIfNotBlank(streamName, text) {
      if (!_.isEmpty(text)) {
        console.log(`== ${suite} ${streamName} BEGIN ==`);
        console.log(text);
        console.log(`== ${suite} ${streamName} END ==`);
      }
    }
    printStreamIfNotBlank('stdout', stdout);
    printStreamIfNotBlank('stderr', stderr);

    if (error) {
      if (error.code === 1) {
        console.error(`${suite} tests failed.`);
      } else {
        if (error.killed) {
          console.log(`${suite} tests timeout of ${karmaTimeoutSeconds()} seconds exceeded`);
        } else {
          console.error(`Failed to run ${suite} tests: ${error}`);
        }
      }

      process.exit(1);
    }
  };
}

function karmaTimeoutSeconds() {
  return (parseInt(process.env.KARMA_TIMEOUT_SECONDS || '600', 10));
}

// Execute test suites in parallel.
suites.forEach(function(suite) {
  const timeoutMs = karmaTimeoutSeconds() * 1000;
  console.log(`Spawning Karma tests for ${suite} [background] with ${timeoutMs / 1000} second timeout`);
  const karmaCommand = `node --max_old_space_size=4096 ./node_modules/karma/bin/karma ${generateArgs(suite)}`;
  exec(karmaCommand, {timeout: timeoutMs}, report(suite));
});

console.log('');
