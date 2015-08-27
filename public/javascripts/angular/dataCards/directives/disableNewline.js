/**
 * This is an attribute you add to a textarea that will disallow any
 * newlines or linebreaks.  It will also both keep the caret in the proper
 * position and accurately resize the textarea.
 * It works by preventing the <enter> 'keypress' event and parsing for
 * newlines on the 'input' event. Consequently, an 'ng-model' is required
 * on the textarea for this directive to work.
 */
angular.module('dataCards.directives').directive('disableNewline', function() {
  'use strict';

  return {
    require: 'ngModel',
    restrict: 'A',
    link: function($scope, element, attrs, model) {
      var elementInput$ = Rx.Observable.fromEvent(element, 'input');
      var elementEnterKeypress$ = Rx.Observable.fromEvent(element, 'keypress').
        filter(function(e) {
          return e.which === 13 || e.keyCode === 13;
        });

      // As a fallback, always prevent the default <enter> event.
      elementEnterKeypress$.subscribe(function(e) {
        e.preventDefault();
      });

      // Watch the input event and do a more thorough job disallowing
      // newlines that are pasted.
      elementInput$.subscribe(function(e) {

        // We grab the value from element.val() instead of model.$viewValue
        // because IE 9 - 11 do not update model.$viewValue in time during an
        // 'input' event.
        var value = element.val();
        var valueLength = value.length;
        var changedValue;
        var changedValueLength;
        var caretPosition = e.target.selectionStart;

        // Regex out the newlines.  Update the model instead of the .val()
        // because we want anything directly observing/watching the model
        // to be in sync.
        changedValue = value.replace(/[\r\n]+/gm, '');
        changedValueLength = changedValue.length;
        model.$setViewValue(changedValue);
        model.$render();

        // Move the caret to the correct position.
        e.target.selectionEnd = caretPosition - valueLength + changedValueLength;

        // Broadcast an elastic:adjust event to update the element size.
        $scope.$broadcast('elastic:adjust');
      });
    }
  };
});
