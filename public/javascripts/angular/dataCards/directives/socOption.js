/**
 * We create a <soc-option/> directive because IE9 doesn't like transcluding <option/>s (it
 * transforms them into spans and stuff before the link function can get at it). So create a new
 * element IE9 won't mess with, that essentially just creates an <option/> tag.
 */
module.exports = function() {
  return {
    restrict: 'E',
    replace: true,
    transclude: true,
    template: '<option ng-transclude />'
  };
};
