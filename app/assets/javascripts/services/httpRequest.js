import $ from 'jQuery';

import Environment from '../StorytellerEnvironment';
import StorytellerUtils from '../StorytellerUtils';

var SUPPORTED_REQUEST_METHODS = ['GET', 'PUT'];

export var storytellerAPIRequestHeaders = function() {
  return {
    'X-CSRF-Token': Environment.CSRF_TOKEN
  };
};

export default function httpRequest(method, url, options) {

  return new Promise(
    function(resolve, reject) {

      // A custom rejection handler that munges httpRequest arguments with
      // jQuery's XHR properties.
      function handleError(jqXHR) {

        reject(
          new Error(
            StorytellerUtils.format(
              'Request "{0} {1}" failed ({2}) {3}',
              method.toUpperCase(),
              url,
              jqXHR.status,
              JSON.stringify(jqXHR.responseText) || '<No response>'
            )
          )
        );
      }

      // Reject unsupported HTTP verbs.
      if (SUPPORTED_REQUEST_METHODS.indexOf(method.toUpperCase()) === -1) {

        reject(
          new Error(
            StorytellerUtils.format(
              'Unsupported method "{0}"; supported methods: {1}',
              method.toUpperCase(),
              SUPPORTED_REQUEST_METHODS.join(', ')
            )
          )
        );
      } else {

        // Normalize options to jQuery's ajax method, with reasonable defaults.
        options = options || {};

        $.ajax({
          // Minimal required parameters.
          url: url,
          method: method.toUpperCase(),
          // Callbacks.
          success: resolve,
          error: handleError,
          // Optional parameters.
          data: options.data,
          dataType: options.dataType || 'json',
          contentType: options.contentType || 'application/json',
          headers: options.headers || {}
        });
      }
    }
  );
}
