(function() {
  'use strict';

  angular.
    module('socrataCommon.decorators').
    config(['$provide', function($provide) {
      $provide.decorator('$rootScope', ['$delegate', 'rx', 'observeOnScope', function($delegate, rx) {
        Object.defineProperties($delegate.constructor.prototype, {
          '$destroyAsObservable': {
            value: function(element) {
              var scope = this;
              return rx.Observable.merge(
                  scope.$eventToObservable('$destroy'),
                  element ?
                    rx.Observable.fromEvent(element, '$destroy') :
                    rx.Observable.empty()
                ).
                take(1).
                publish().
                refCount();
            },
            enumerable: false,
            configurable: true,
            writable: true
          }
        });

        return $delegate;
      }]);
    }]);

})();
