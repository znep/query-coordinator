(function() {
  'use strict';

  var LAST_MODIFIED_HEADER_KEY = 'X-SODA2-Truth-Last-Modified';

  function LastModifiedHttpInterceptor(moment) {
    var observable = new Rx.Subject();
    var regex = new RegExp('/api/id/\\w{4}-\\w{4}.json');
    var toDate = function(input) {
      return new Date(input);
    };

    return {
      response: function(response) {
        var lastModified = response.headers(LAST_MODIFIED_HEADER_KEY);
        if (lastModified && regex.test(response.config.url)) {
          observable.onNext(lastModified);
        }
        return response;
      },
      observable: observable.distinctUntilChanged().map(toDate),
      regex: regex,
      toDate: toDate
    };
  }

  angular.module('dataCards.services').
    config(function($provide, $httpProvider) {
      $provide.factory('LastModified', LastModifiedHttpInterceptor);
      $httpProvider.interceptors.push('LastModified');
    });

})();
