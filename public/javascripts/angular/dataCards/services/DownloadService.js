(function() {
  'use strict';

  var TRACKING_ID_PARAM = 'renderTrackingId';
  var POLL_INTERVAL = 1000;
  var TIMEOUT = 30000;

  var httpRequester = {
    requesterLabel: function() {
      return 'download-service';
    }
  };

  /**
   * A service that lets you download files (assuming the server sets
   * Content-Disposition:attachment) without risking navigating away from the page if the server
   * responds incorrectly.
   */
  angular.module('dataCards.services').factory('DownloadService', function($q, $window, http) {
    /**
     * Have the user's browser download the specified path.
     *
     * @param {String} path The path to the resource to download. The server must respond with
     * Content-Disposition:attachment, and the path must be on the same domain.
     * @param vif For testing, a mock iframe element.
     *
     * @return {Promise} an object with a 'then' function that takes two parameters: the success
     * function callback, and the error function callback.
     */
    function download(path, vif) {
      var deferred = $q.defer();

      // Give the server a tracking id for this request, so it can let us know when a request is
      // finished.
      var trackingId = _.uniqueId();
      var cookieName = 'renderTrackingId_' + trackingId;
      if (path.indexOf('?') < 0) {
        path += '?';
      } else if (path.charAt(path.length - 1) !== '?') {
        path += '&';
      }
      path += TRACKING_ID_PARAM + '=' + encodeURIComponent(trackingId);

      var timeout$ = Rx.Observable.timer(TIMEOUT, Rx.Scheduler.timeout);
      var timeoutError$ = timeout$.
        flatMap(function() {
          return Rx.Observable['throw'](new Error('timeout'));
        });

      // Poll for the existence of the cookie that confirms that this request has connected.
      var success$ = Rx.Observable.timer(POLL_INTERVAL, POLL_INTERVAL, Rx.Scheduler.timeout).
        takeUntil(timeout$).
        map(function() {
          return $window.document.cookie;
        }).
        filter(function(cookie) {
          return cookie.indexOf(cookieName + '=') >= 0;
        }).
        share();

      success$.
        subscribe(function() {
          $window.document.cookie = cookieName + '=;path=/;expires=' + (new Date(0).toUTCString());
        });

      // Create an observable to terminate our event streams, that is triggered when the success,
      // error, or timeout observables emit
      var complete$ = Rx.Observable.merge(
        success$,
        timeoutError$
      );

      complete$.
        // Chrome doesn't like it when you remove the iframe while it's downloading. So only do the
        // cleanup if it's not successful
        subscribe(function() {
          deferred.resolve();
        }, function(e) {
          deferred.reject({ error: e.message });
        });

      // In IE9, submit a form with a "post" method and poll for the appropriate cookie.  In real
      // browsers, request a blob from polaroid and use FileSaver.js to download the response.
      // TODO once we stop supporting IE9 delete everything in this function except for the "else"
      // block below.
      if (typeof navigator !== 'undefined' && /MSIE [1-9]\./.test(navigator.userAgent)) {
        var form = $(
          '<form style="display: none;" action="' + path + '" method="post">' +
            '<input type="text" name="vif"/>' +
          '</form>'
        );
        form.find('input').attr('value', JSON.stringify(vif));
        $($window.document.body).append(form);
        form[0].submit();
        form.remove();
      } else {
        var payload = {
          vif: JSON.stringify(vif)
        };

        var httpConfig = {
          timeout: TIMEOUT,
          requester: httpRequester,
          responseType: 'blob'
        };

        http.post(path, payload, httpConfig).then(function(response) {
          var contentDisposition = response.headers('Content-Disposition');
          var filename = '{0}.png'.format(vif.columnName);

          if (_.isString(contentDisposition)) {
            var matches = contentDisposition.match(/filename=\"([^\"]+)\"/);
            filename = _.isPresent(matches[1]) ? matches[1] : filename;
          }

          saveAs(response.data, filename);
          deferred.resolve();
        }, function(error) {
          deferred.reject({ error: error });
        });
      }

      return deferred.promise;
    }

    return {
      download: download
    };
  });
})();
