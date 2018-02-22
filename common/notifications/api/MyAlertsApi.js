import 'whatwg-fetch';
import { checkStatus } from 'common/notifications/api/helper';
import { fromApiParams } from 'common/components/CreateAlertModal/api/AlertConverter';

function getDefaultHeaders() {
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };
}

export const MyAlertsApi = (() => {
  return {
    get: () => {
      return fetch('/api/notifications_and_alerts/alerts', {
        method: 'GET',
        headers: getDefaultHeaders(),
        credentials: 'same-origin'
      }).
      then((response) => checkStatus(response, 'An error was encountered while getting alert preferences, please try again or contact support@socrata.com')).
      then((response) => response.json()).
      then((response) => fromApiParams(response.data));
    }
  };
})();

export default MyAlertsApi;
