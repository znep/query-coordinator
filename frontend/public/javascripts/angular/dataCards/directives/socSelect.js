var templateUrl = require('angular_templates/dataCards/socSelect.html');

/**
 * A socrata-styled drop-down selector.
 */
module.exports = function() {

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
