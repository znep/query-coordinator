const spawn = require('child_process').spawn;

module.exports = function(callback) {
  spawn(
    'cd ../packages/socrata-components/ && npm run build && cd ..',
    {
      stdio: 'inherit',
      shell: true
    }
  ).on('close',
    function() {
      callback();
    }
  );
};
