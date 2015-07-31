(function(window) {

  if (
    (!window._) ||
    (_.prototype.constructor.toString().match(/lodash/i) === null)
  ) {
    throw new Error('lodash is a required dependency for `socrata-utils.js`.');
  }

  window.socrata = window.socrata || {};
  window.socrata.visualizations = window.socrata.visualizations || {};

})(window);
