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
     * @return {Promise} an object with methods 'success' and 'error', that are called if the
     * download succeeds or encounters an error, respectively.
     */
    function download(path) {
      // Give the server a tracking id for this request, so it can let us know when a request is
      // finished.
      var trackingId = _.uniqueId();
      var cookieName = 'renderTrackingId' + trackingId;
      if (path.indexOf('?') < 0) {
        path += '?';
      } else if (path.charAt(path.length-1) !== '?') {
        path += '&';
      }
      path += TRACKING_ID_PARAM + '=' + encodeURIComponent(trackingId);

      var timeout = new Rx.Subject().timeout(TIMEOUT);

      // Add the iframe that does the actual work
      var iframe = $('<iframe />').css('display', 'none').appendTo('body');
      // downloads that have the Content-Disposition: attachment set do not fire the 'load' event
      // (except in FireFox < 3) So if the load event fires, assume it's a 500 or some such
      var errorObservable = Rx.Observable.fromEvent(iframe, 'load').take(1).map(function(e) {
        return {error: e.target.contentDocument.innerHTML};
      });

      // Poll for the existence of the cookie that confirms that this request has connected.
      var successObservable = Rx.Observable.timer(1, POLL_INTERVAL).takeUntil(timeout).
          filter(function poll() {
            if (document.cookie.indexOf(cookieName + '=') >= 0) {
              document.cookie = cookieName + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT';
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
      completeObservable.subscribe(cleanupIframe, _.noop);

      // Trigger the actual load
      iframe.prop('src', path);

      // Implement the promise interface, so we can lazily add subscribers
      var promise = {
        then: function(success, error) {
          var onNext = !success ? _.noop : function onNext(result) {
            if (result.error) {
              error(result.error);
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
