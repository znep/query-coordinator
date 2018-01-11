// Note: This is copied from frontend's karma tests.
// We'll accept the duplication for a few weeks as
// the repos will shortly get merged together.
module.exports = function() {
  return function() {
    this.plugin('done', function(stats) {
      var warnings = stats.compilation.warnings;

      if (warnings.length > 0) {
        console.log(
          `platform-ui/common/spec/visualizations/helpers/WebpackFailurePlugin.js:${warnings[0].message}`
        );

        // Don't throw errors when in watch mode
        if (process.argv.join('').indexOf('--singleRunfalse') === -1) {
          throw new Error('Encountered warnings when compiling webpack bundle.  Aborted test run');
        }
      }
    });
  };
};
