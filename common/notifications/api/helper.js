import 'whatwg-fetch';
import airbrake from 'common/airbrake';

/* eslint no-empty: ["error", { "allowEmptyCatch": true }] */

export const checkStatus = (response, errorInfo) => {
  let errorMessage;
  if (response.status === 401 || response.status === 403) {
    // session may expired so we are reloading the page
    window.location.reload();
  } else if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
    errorMessage = response.statusText;
    try {
      airbrake.notify({
        error: `${errorInfo}: ${errorMessage}`
      });
    } catch (err) {
    }
    throw new Error(errorMessage);
  }
};
