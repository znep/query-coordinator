import $ from 'jquery';
import _ from 'lodash';

import Environment from '../StorytellerEnvironment';
import StorytellerUtils from '../StorytellerUtils';
import { exceptionNotifier } from './ExceptionNotifier';

const SUPPORTED_REQUEST_METHODS = ['GET', 'PUT', 'POST'];
const PERMITTED_OPTIONS = ['data', 'dataType', 'contentType', 'headers'];

export const coreHeaders = () => {
  if (_.isEmpty(Environment.CORE_SERVICE_APP_TOKEN)) {
    notifyMissingAppToken();
  }

  const csrfToken = decodeURIComponent(StorytellerUtils.getCookie('socrata-csrf-token'));

  return {
    'X-App-Token': Environment.CORE_SERVICE_APP_TOKEN,
    'X-CSRF-Token': csrfToken,
    'X-Socrata-Host': window.location.hostname
  };
};

export const storytellerHeaders = () => {
  const csrfToken = _.get(
    document.querySelector('meta[name="csrf-token"]'), 'content', ''
  );

  return {
    'X-App-Token': Environment.CORE_SERVICE_APP_TOKEN,
    'X-CSRF-Token': csrfToken,
    'X-Socrata-Host': window.location.hostname
  };
};

export const federationHeaders = () => ({
  'X-Socrata-Federation': 'Honey Badger'
});

export default function httpRequest(method, url, options) {

  // Normalize arguments with reasonable defaults.
  method = _.toUpper(method);

  options = _.defaults(options, {
    dataType: 'json',
    contentType: 'application/json',
    headers: {}
  });

  // Prepare JSON data if necessary.
  if (options.data && !_.isString(options.data) && options.contentType === 'application/json') {
    options.data = JSON.stringify(options.data);
  }

  // Sanity check for required parameters.
  StorytellerUtils.assertIsOneOfTypes(url, 'string');
  StorytellerUtils.assert(
    _.includes(SUPPORTED_REQUEST_METHODS, method),
    `Unsupported HTTP method ${method}; supported methods: ${SUPPORTED_REQUEST_METHODS.join(', ')}`
  );

  return new Promise((resolve, reject) => {

    // A custom rejection handler that munges httpRequest arguments with
    // jQuery's XHR properties.
    function handleError(jqXHR, xhrStatus) {
      const { status, responseText } = jqXHR;
      const response = JSON.stringify(responseText) || '<No response>';

      if (status === 200 && xhrStatus === 'parsererror') {
        // Workaround for bad Core behavior - see EN-13538
        resolve({
          data: null,
          status: 'success',
          jqXHR
        });
      } else {
        // Actually an error condition
        const responseError = new Error(
          `Request "${method} ${url}" failed (${status}) ${response}`
        );
        responseError.statusCode = status;
        responseError.response = responseText;
        responseError.jqXHR = jqXHR;

        reject(responseError);
      }
    }

    $.ajax(_.extend(
      // Only allow specified options to be passed through directly.
      _.pick(options, PERMITTED_OPTIONS),
      {
        // Required parameters.
        url,
        method,
        // Callbacks and lifecycle settings.
        processData: !(options.data instanceof Blob),
        success: (data, status, jqXHR) => resolve({ data, status, jqXHR }),
        error: handleError
      }
    ));
  });
}

// Wrapped with _.once to prevent possible Airbrake spam.
const notifyMissingAppToken = _.once(() => {
  exceptionNotifier.notify(new Error(
    'Environment.CORE_SERVICE_APP_TOKEN not configured.'
  ));
});
