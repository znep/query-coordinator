const exec = require('child_process').exec;

module.exports = function(callback) {
  exec(
    'npm run webpack',
    {
      stdio: 'inherit'
    },
    callback
  );
};

