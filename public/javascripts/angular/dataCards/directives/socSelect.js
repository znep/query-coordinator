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
    _.each($attrs, function(value, key) {
      // Ignore angular properties
      if (key.charAt(0) !== '$') {
        filteredAttrs[key] = value;
      }
    });
    element.attr(filteredAttrs);
  }

  /**
   * @param {jQuery} element The jquery element that contains the arrow and select.
   */
  function fixArrowForBrowsers(element) {
    if (!Modernizr.pointerevents) {
      // Clicking on our custom arrow won't pass it through in this browser. Move it behind the
      // select.
      element.find('select').css({
        position: 'relative',
        zIndex: 5
      });
    }
  }

  return {
    scope: {
      ngModel: '=',
      disabled: '@?'
    },
    restrict: 'E',
    transclude: true,
    templateUrl: '/angular_templates/dataCards/socSelect.html',
    link: function($scope, $element, $attrs) {
      fixArrowForBrowsers($element);
      var selectElement = $element.children('select');
      applyAttributes($attrs, selectElement)
      $scope.$watch('disabled', function(d) {
        selectElement.attr('disabled', d);
      });
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
