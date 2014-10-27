/**
 * A socrata-styled drop-down selector.
 */
angular.module('dataCards.directives').directive('socSelect', function() {
  /**
   * Apply the given dom attributes to the given element, ignoring angular-specific ones (ie those
   * prefixed with a $).
   *
   * @param {Object} $attrs The angular attributes.
   * @param {jQuery} element The jquery element to apply the attributes to.
   */
  function applyAttributes($attrs, element) {
    var filteredAttrs = {};
    _.each($attrs, function(v, k) {
      // Ignore angular properties
      if (k.charAt(0) !== '$') {
        filteredAttrs[k] = v;
      }
    });
    element.attr(filteredAttrs);
  }
  return {
    scope: {
      ngModel: '='
    },
    restrict: 'E',
    transclude: true,
    templateUrl: '/angular_templates/dataCards/socSelect.html',
    link: function($scope, $element, $attrs) {
      applyAttributes($attrs, $element.children('select'))
    }
  }
}).
  /**
   * We create a <soc-option/> directive here because IE9 doesn't like transcluding <option/>s (it
   * transforms them into spans and stuff before the link function can get at it). So create a new
   * element IE9 won't mess with, that essentially just creates an <option/> tag.
   */
  directive('socOption', function() {
    return {
      restrict: 'E',
      replace: true,
      transclude: true,
      template: '<option ng-transclude />'
    };
});
