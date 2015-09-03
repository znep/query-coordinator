(function(root) {
  'use strict';

  var storyteller = root.socrata.storyteller;
  var utils = root.socrata.utils;

  /**
   * @function StoryPermissionsManager
   */
  function StoryPermissionsManager() {

    /**
     * @function makePublic
     */
    this.makePublic = function (errorCallback) {
      _updatePermissions(true).
        then(
          _handleRequestSuccess,
          function(error) {
            _handleRequestError(error, errorCallback);
          }
        );
    };

    /**
     * @function makePrivate
     */
    this.makePrivate = function (errorCallback) {
      _updatePermissions(false).
        then(
          _handleRequestSuccess,
          function(error) {
            _handleRequestError(error, errorCallback);
          }
        );
    };

    function _handleRequestSuccess(response) {
      utils.assertIsOneOfTypes(response, 'object');
      utils.assertHasProperty(response, 'isPublic');
      utils.assertIsOneOfTypes(response.isPublic, 'boolean');

      var payload = {
        action: Constants.STORY_SET_PERMISSIONS,
        storyUid: storyteller.userStoryUid,
        isPublic: response.isPublic
      };

      storyteller.dispatcher.dispatch(payload);
    }

    function _handleRequestError(error, callback) {
      utils.assertIsOneOfTypes(error, 'object');
      utils.assertHasProperty(error, 'message');
      utils.assertIsOneOfTypes(error.message, 'string');

      callback(error.message);
    }

    function _updatePermissions(setPublic) {
      utils.assertIsOneOfTypes(setPublic, 'boolean');

      var value = setPublic ? 'public.read' : 'private';
      var query = 'accessType=WEBSITE&method=setPermission&value=' + value;
      var url = '/views/{0}.json?{1}'.format(storyteller.userStoryUid, query);
      var headers = _coreRequestHeaders();

      return new Promise(function(resolve, reject) {

        var xhr = new XMLHttpRequest();

        function onFail() {

          return reject({
            status: parseInt(xhr.status, 10),
            message: xhr.statusText
          });
        }

        xhr.onload = function() {

          var status = parseInt(xhr.status, 10);

          if (status === 200) {
            return resolve({isPublic: setPublic});
          }

          onFail();
        };

        xhr.onabort = onFail;
        xhr.onerror = onFail;

        xhr.open('PUT', url, true);

        // Set user-defined headers.
        _.each(headers, function(value, key) {
          xhr.setRequestHeader(key, value);
        });

        xhr.send();
      });
    }

    function _coreRequestHeaders() {
      var headers = {};

      if (_.isEmpty(storyteller.config.coreServiceAppToken)) {
        storyteller.notifyAirbrake({
          error: {
            message: '`storyteller.config.coreServiceAppToken` not configured.'
          }
        });
      }

      headers['X-App-Token'] = storyteller.config.coreServiceAppToken;
      headers['X-CSRF-Token'] = decodeURIComponent(utils.getCookie('socrata-csrf-token'));

      return headers;
    }
  }

  root.storyteller.StoryPermissionsManager = StoryPermissionsManager;

})(window);
