(function() {
  'use strict';

  var TRACKING_ID_PARAM = 'renderTrackingId';
  var POLL_INTERVAL = 1000;
  var TIMEOUT = 30000;

  /**
   * A service that lets you download files (assuming the server sets
   * Content-Disposition:attachment) without risking navigating away from the page if the server
   * responds incorrectly.
   */
  angular.module('dataCards.services').factory('DownloadService', function() {
    /**
     * Have the user's browser download the specified path.
     *
     * @param {String} path The path to the resource to download. The server must respond with
     * Content-Disposition:attachment, and the path must be on the same domain.
     * @param {jQuery=} _iframe For testing, a mock iframe element.
     *
     * @return {Promise} an object with a 'then' function that takes two parameters: the success
     * function callback, and the error function callback.
     */
    function download(path, _iframe) {
      // Give the server a tracking id for this request, so it can let us know when a request is
      // finished.
      var trackingId = _.uniqueId();
      var cookieName = 'renderTrackingId_' + trackingId;
      if (path.indexOf('?') < 0) {
        path += '?';
      } else if (path.charAt(path.length-1) !== '?') {
        path += '&';
      }
      path += TRACKING_ID_PARAM + '=' + encodeURIComponent(trackingId);

      var timeout = new Rx.Subject().timeout(TIMEOUT);

      // Add the iframe that does the actual work
      var iframe = (_iframe || $('<iframe/>')).
          css('display', 'none').appendTo('body');
      // downloads that have the Content-Disposition: attachment set do not fire the 'load' event
      // (except in FireFox < 3) So if the load event fires, assume it's a 500 or some such
      var errorObservable = Rx.Observable.fromEvent(iframe, 'load').take(1).map(function(e) {
        try {
          return {error: e.target.contentDocument.body.innerHTML};
        } catch(e) {
          // This happens on IE9 if the server returns non-200 - it loads some IE error page from
          // a file: url or some ridiculousness that causes cross-domain errors.
          return {error: true};
        }
      }).share();

      // Poll for the existence of the cookie that confirms that this request has connected.
      var successObservable = Rx.Observable.timer(1, POLL_INTERVAL).takeUntil(timeout).
          filter(function poll() {
            if (document.cookie.indexOf(cookieName + '=') >= 0) {
              document.cookie = cookieName + '=;path=/;expires=' + (new Date(0).toUTCString());
              return true;
            }
          }).take(1).map(function() {
            return {};
          }).share();

      // Create an observable to terminate our event streams, that is triggered by the success or
      // error callback firing.
      var completeObservable = Rx.Observable.amb(
        successObservable,
        errorObservable
      );

      function cleanupIframe() {
        iframe.remove();
      }
      // Chrome doesn't like it when you remove the iframe while it's downloading. So only do the
      // cleanup if it's not successful
      completeObservable.filter(function(result) {
        return _.has(result, 'error');
      }).subscribe(cleanupIframe, cleanupIframe);

      // Trigger the actual load
      iframe.prop('src', path);

      // Implement the promise interface, so we can lazily add subscribers
      var promise = {
        then: function(success, error) {
          var onNext = !success ? _.noop : function onNext(result) {
            if (_.has(result, 'error')) {
              error(result);
            } else {
              success();
            }
          };
          var onError = !error ? _.noop : function onError() {
            error({timeout: true});
          };

          completeObservable.subscribe(onNext, onError);
          return promise;
        }
      };

      return promise;
    }

    return {
      download: download
    };
  });
})();
