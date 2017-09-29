import 'whatwg-fetch';
import airbrake from 'common/airbrake';
import _ from 'lodash';

/* eslint no-empty: ["error", { "allowEmptyCatch": true }] */

function checkStatus(response) {
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
        error: `Error while set/get alert preference: ${errorMessage}`
      });
    } catch (err) {
    }
    throw new Error(errorMessage);
  }
}


function defaultHeaders() {
  return _.omitBy({
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }, _.isUndefined);
}

function encodePreferenceFormat(preferences) {
  let encodedPreferences = [];
  _.each(preferences, (preferenceData, preference) => {
    if (!_.isEmpty(preferenceData.sub_categories)) {
      _.each(preferenceData.sub_categories, (subCategoryData, subCategory) => {
        encodedPreferences.push({
          name: preference,
          type: subCategory,
          //value stores strings
          value: subCategoryData.enable ? 'true' : 'false',
          enable_email_notification: preferenceData.enable_email,
          enable_product_notification: preferenceData.enable_product_notification
        })
      });
    } else {
      encodedPreferences.push({
        name: preference,
        enable_email_notification: preferenceData.enable_email,
        enable_product_notification: preferenceData.enable_product_notification
      })
    }
  });
  return encodedPreferences;
}

function decodePreferenceFormat(preferences) {
  if (_.isEmpty(preferences)) {
    return {};
  }
  let decodedPreferences = {};
  let preferencesGroupedByName = _.groupBy(preferences, 'name');
  _.each(preferencesGroupedByName, (preferenceData, name) => {
    decodedPreferences[name] = {};
    decodedPreferences[name] = {
      enable_email: _.get(preferenceData[0], 'enable_email_notification', false),
      enable_product_notification: _.get(preferenceData[0], 'enable_product_notification', false)
    };
    if (_.some(preferenceData, 'type')) {
      decodedPreferences[name].sub_categories = {};
      _.each(preferenceData, (preference) => {
        const enableValue = _.get(preference, 'value', 'false');
        decodedPreferences[name].sub_categories[preference.type] = {enable: (enableValue == 'true')}
      });
    }
  });
  return decodedPreferences;
}

export const AlertPreferenceStore = (() => {
  return {
    get: () => {
      return fetch('/api/notifications_and_alerts/preferences', {
        method: 'GET',
        headers: defaultHeaders(),
        credentials: 'same-origin',
      }).
      then(checkStatus).
      then((response) => response.json()).
      then((response) => {
        return decodePreferenceFormat(response.data);
      });
    },
    set: (preferences) => {
      let encodePreferences = encodePreferenceFormat(preferences);
      return fetch('/api/notifications_and_alerts/preferences', {
        method: 'POST',
        headers: defaultHeaders(),
        credentials: 'same-origin',
        body: JSON.stringify({preferences: encodePreferences})
      }).
      then(checkStatus).
      then((response) => response.json()).
      then((response) => response.data)

    }
  };
})();

export default AlertPreferenceStore;
