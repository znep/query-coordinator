var templateUrl = require('angular_templates/dataCards/socSelect.html');

/**
 * A socrata-styled drop-down selector.
 */
module.exports = function($window) {

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

        var option = $window.document.createElement('option');
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
    templateUrl: templateUrl,
    link: function($scope, $element, $attrs) {
      var selectElement = $element.children('select');
      ieSelectFix(selectElement);
      applyAttributes($attrs, selectElement);
      $scope.$watch('disabled', function(disabled) {
        selectElement.attr('disabled', disabled);
      });

      $element.find('select').change(function(event) {
        $scope.$emit('soc-select-change', event.target.value);
      });
    }
  };
};