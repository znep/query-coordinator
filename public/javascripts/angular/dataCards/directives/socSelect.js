(function() {
  'use strict';

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

    // Fixes two bugs in IE:
    // 1. Correctly renders selects with dynamically changing options.
    // 2. Move the arrow behind the select because pointer-events do not exist.
    function ieSelectFix(selectElement) {
      if (!Modernizr.pointerEvents) {

        // Add and remove an option from the select element to force it
        // to re-render.  The setTimeout is needed for Angular 1.3+.
        // https://github.com/angular/angular.js/issues/2809
        _.defer(function() {

          var option = document.createElement('option');
          selectElement[0].add(option, null);
          selectElement[0].remove(selectElement[0].options.length - 1);
        });

        // Move arrow behind the select.
        selectElement.css({
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
        var selectElement = $element.children('select');
        ieSelectFix(selectElement);
        applyAttributes($attrs, selectElement);
        $scope.$watch('disabled', function(disabled) {
          selectElement.attr('disabled', disabled);
        });
      }
    };
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
})();
