(function() {
  'use strict';

  function SelectionLabel($window) {
    return {
      restrict: 'E',
      scope: {
        content: '='
      },
      templateUrl: '/angular_templates/dataCards/selectionLabel.html',
      link: function($scope, element, attrs) {
        var $selectionLabelContent = element.find('.selection-label-inner');
        var mouseHasNotMovedSinceMouseDown = false;

        $selectionLabelContent.on('mousedown', function() {
          mouseHasNotMovedSinceMouseDown = true;
        });

        $selectionLabelContent.on('mousemove', function() {
          mouseHasNotMovedSinceMouseDown = false;
        });

        // Also reset the mouse state on scroll so it doesn't auto-select the API url
        // when we try to maniuplate the scroll bar.
        $selectionLabelContent.on('scroll', function() {
          mouseHasNotMovedSinceMouseDown = false;
        });

        $selectionLabelContent.on('mouseup', function() {
          if (mouseHasNotMovedSinceMouseDown) {

            var range;
            var selection;
            var text = $selectionLabelContent.get(0);

            // Cater to IE...
            if ($window.document.body.createTextRange) {
              range = $window.document.body.createTextRange();
              range.moveToElementText(text);
              range.select();
              // ...or everyone else.
            } else if ($window.getSelection) {
              selection = $window.getSelection();
              range = $window.document.createRange();
              range.selectNodeContents(text);
              selection.removeAllRanges();
              selection.addRange(range);
            }
          }
        });
      }
    };
  }

  angular.
    module('dataCards.directives').
    directive('selectionLabel', SelectionLabel);

})();
