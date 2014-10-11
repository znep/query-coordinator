angular.module('dataCards.services').factory('JJV', function() {
  var jjv = window.jjv();
  /**
   * The card model was storing levels as Strings, but telling jjv they were integers.
   */
  jjv.addTypeCoercion('integer', function(s) {
    if (_.isString(s)) {
      return parseInt(s, 10);
    }
    return s;
  });

  return jjv;
});
