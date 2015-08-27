(function() {
  'use strict';

  function ClearableInput(WindowState) {
    return {
      restrict: 'E',
      scope: { 'search': '=', 'placeholderValue': '@placeholder', 'inputId': '@' },
      templateUrl: '/angular_templates/dataCards/clearableInput.html',
      link: function($scope, element) {
        var searchInput = element.find('input');
        var blurEventObservable = Rx.Observable.fromEvent(searchInput, 'blur');
        var focusEventObservable = Rx.Observable.fromEvent(searchInput, 'focus');
        var placeholderObservable = Rx.Observable.merge(
          Rx.Observable.returnValue($scope.placeholderValue),
          blurEventObservable.map(function() { return $scope.placeholderValue; }),
          focusEventObservable.map(function() {

            // Avoid returning an empty string to fix a positioning bug when
            // there is no placeholder (see CORE-6439).
            return ' ';

          })
        );
        var searchInputObservable = $scope.$observe('search');
        var hasInputObservable = searchInputObservable.
          map($.isPresent).
          distinctUntilChanged();

        var clearInput = function() {
          /*
           * Without the defer the search property gets set back to whatever
           * was in the input in Firefox.
           */
          _.defer(function() {
            $scope.$safeApply(function() {
              $scope.search = '';
            });
          });
        };

        $scope.clearInput = clearInput;
        Rx.Observable.
          merge(
            blurEventObservable.map(function() { return false; }),
            focusEventObservable.map(function() { return true; })
          ).
          startWith(false).
          flatMapLatest(function(isFocused) {
            if (isFocused) {
              return WindowState.escapeKeyObservable;
            } else {
              return Rx.Observable.empty();
            }
          }).takeUntil($scope.$destroyAsObservable(element)).subscribe(clearInput);

        $scope.$emitEventsFromObservable(
          'clearableInput:keydown',
          Rx.Observable.fromEvent(searchInput, 'keydown')
        );
        $scope.$emitEventsFromObservable(
          'clearableInput:keypress',
          Rx.Observable.fromEvent(searchInput, 'keypress')
        );
        $scope.$emitEventsFromObservable(
          'clearableInput:click',
          Rx.Observable.fromEvent(searchInput, 'click')
        );
        $scope.$emitEventsFromObservable(
          'clearableInput:blur',
          Rx.Observable.fromEvent(searchInput, 'blur')
        );
        $scope.$bindObservable('placeholder', placeholderObservable);
        $scope.$bindObservable('hasInput', hasInputObservable);
      }
    };
  }

  angular.module('dataCards.directives').directive('clearableInput', ClearableInput);

})();
