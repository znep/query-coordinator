(function() {
  'use strict';

  var TRACKING_ID_PARAM = 'renderTrackingId';
  var POLL_INTERVAL = 1000;
  var TIMEOUT = 30000;

  function cleanupIframe(iframe) {
    iframe.remove();
  }

  /**
   * A service that lets you download files (assuming the server sets
   * Content-Disposition:attachment) without risking navigating away from the page if the server
   * responds incorrectly.
   */
  angular.module('dataCards.services').factory('DownloadService', function($q) {
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
      var deferred = $q.defer();

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

      // Add the iframe that does the actual work
      var iframe = (_iframe || $('<iframe/>')).
        css('display', 'none').appendTo('body');

      var timeoutObservable = Rx.Observable.timer(TIMEOUT, Rx.Scheduler.timeout);
      var timeoutErrorObservable = timeoutObservable.
        flatMap(function() {
          return Rx.Observable['throw'](new Error('timeout'));
        });

      // downloads that have the Content-Disposition: attachment set do not fire the 'load' event
      // (except in FireFox < 3) So if the load event fires, assume it's a 500 or some such
      var errorObservable = Rx.Observable.fromEvent(iframe, 'load').
        flatMap(function(e) {
          return Rx.Observable['throw'](new Error(_.get(e, 'target.contentDocument.body.innerHTML', true)));
        });

      // Poll for the existence of the cookie that confirms that this request has connected.
      var successObservable = Rx.Observable.timer(POLL_INTERVAL, POLL_INTERVAL, Rx.Scheduler.timeout).
        takeUntil(timeoutObservable).
        map(function() {
          return document.cookie;
        }).
        filter(function(cookie) {
          return cookie.indexOf(cookieName + '=') >= 0;
        }).
        share();

      successObservable.
        subscribe(function() {
          document.cookie = cookieName + '=;path=/;expires=' + (new Date(0).toUTCString());
        });

      // Create an observable to terminate our event streams, that is triggered when the success,
      // error, or timeout observables emit
      var completeObservable = Rx.Observable.merge(
        successObservable,
        timeoutErrorObservable,
        errorObservable
      );

      completeObservable.
        // Chrome doesn't like it when you remove the iframe while it's downloading. So only do the
        // cleanup if it's not successful
        finallyAction(_.bind(cleanupIframe, this, iframe)).
        subscribe(function() {
          deferred.resolve();
        }, function(e) {
          deferred.reject({ error: e.message });
        });

      // Trigger the actual load
      iframe.prop('src', path);

      return deferred.promise;
    }

    return {
      download: download
    };
  });
})();
