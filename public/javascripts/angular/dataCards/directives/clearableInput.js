(function() {
  'use strict';

  function ClearableInput($document, AngularRxExtensions, WindowState) {
    return {
      restrict: 'E',
      scope: { 'search': '=', 'placeholderValue': '@placeholder', 'inputId': '@' },
      templateUrl: '/angular_templates/dataCards/clearableInput.html',
      link: function($scope, element, attrs) {
        AngularRxExtensions.install($scope);

        var searchInput = element.find('input');
        var blurEventObservable = Rx.Observable.fromEvent(searchInput, 'blur');
        var focusEventObservable = Rx.Observable.fromEvent(searchInput, 'focus');
        var placeholderObservable = Rx.Observable.merge(
          Rx.Observable.returnValue($scope.placeholderValue),
          blurEventObservable.map(function() { return $scope.placeholderValue; }),
          focusEventObservable.map(function() { return ''; })
        );
        var searchInputObservable = $scope.observe('search');
        var hasInputObservable = searchInputObservable.
          map($.isPresent).
          distinctUntilChanged();

        var clearInput = function() {
          $scope.safeApply(function() {
            $scope.search = '';
          })
        };

        $scope.clearInput = clearInput;
        Rx.Observable.
          merge(
            blurEventObservable.map(function() { return false; }),
            focusEventObservable.map(function() { return true; })
          ).
          startWith(false).
          flatMapLatest(function(isFocused) {
            if(isFocused) {
              return WindowState.escapeKeyObservable;
            }
            else {
              return Rx.Observable.empty();
            }
          }).subscribe(clearInput);

        $scope.bindObservable('placeholder', placeholderObservable);
        $scope.bindObservable('hasInput', hasInputObservable);

      }
    };
  }

  angular.module('dataCards.directives').directive('clearableInput', ClearableInput);

})();
