module.exports = function() {
  return function() {
    this.plugin('done', function(stats) {
      var warnings = stats.compilation.warnings;

      if (warnings.length > 0) {
        console.log(warnings[0].message);

        // Don't throw errors when in watch mode
        if (process.argv.join('').indexOf('--singleRunfalse') === -1) {
          throw new Error('Encountered warnings when compiling webpack bundle.  Aborted test run');
        }
      }
    });
  };
};
