import $ from 'jQuery';

import StorytellerUtils from '../StorytellerUtils';

var SUPPORTED_REQUEST_METHODS = ['GET'];

export default function httpRequest(method, url, acceptType) {

  return new Promise(
    function(resolve, reject) {

      if (SUPPORTED_REQUEST_METHODS.indexOf(method.toUpperCase()) === -1) {

        reject(
          new Error(
            'Unsupported method "{0}"; supported methods: {1}'.format(
              method.toUpperCase(),
              SUPPORTED_REQUEST_METHODS
            )
          )
        );
      }

      var options = {
        url: url,
        method: method
      };

      function handleError(jqXHR) {

        reject(
          new Error(
            StorytellerUtils.format(
              'Request "{0} {1}" failed ({2}) {3}',
              method.toUpperCase(),
              url,
              jqXHR.status,
              (JSON.stringify(jqXHR.responseText) || '<No response>')
            )
          )
        );
      }

      options.success = resolve;
      options.error = handleError;

      if ((acceptType || '').toLowerCase() === 'json') {
        // Setting `options.dataType` affects the `Accept` header as well as a
        // few other response handling things.
        //
        // See: http://api.jquery.com/jquery.ajax/
        options.dataType = 'json';
      }

      $.ajax(options);
    }
  );
}
