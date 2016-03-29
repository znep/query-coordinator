var templateUrl = require('angular_templates/dataCards/clearableInput.html');

module.exports = function ClearableInput(WindowState, rx) {
  const Rx = rx;
  return {
    restrict: 'E',
    scope: {
      search: '=',
      placeholderValue: '@placeholder',
      inputId: '@'
    },
    templateUrl: templateUrl,
    link: function($scope, element) {
      var searchInput = element.find('input');
      var blurEvent$ = Rx.Observable.fromEvent(searchInput, 'blur');
      var focusEvent$ = Rx.Observable.fromEvent(searchInput, 'focus');
      var placeholder$ = Rx.Observable.merge(
        Rx.Observable.returnValue($scope.placeholderValue),
        blurEvent$.map(function() { return $scope.placeholderValue; }),
        focusEvent$.map(function() {

          // Avoid returning an empty string to fix a positioning bug when
          // there is no placeholder (see CORE-6439).
          return ' ';

        })
      );
      var searchInput$ = $scope.$observe('search');
      var hasInput$ = searchInput$.
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
          blurEvent$.map(function() { return false; }),
          focusEvent$.map(function() { return true; })
        ).
        startWith(false).
        flatMapLatest(function(isFocused) {
          if (isFocused) {
            return WindowState.escapeKey$;
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
      $scope.$bindObservable('placeholder', placeholder$);
      $scope.$bindObservable('hasInput', hasInput$);
    }
  };
};
