import 'whatwg-fetch';
import airbrake from 'common/airbrake';
import _ from 'lodash';
import { checkStatus } from 'common/notifications/api/helper';

function getDefaultHeaders() {
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };
}

function encodePreferenceFormat(preferences) {
  let encodedPreferences = [];
  _.each(preferences, (preferenceData, preference) => {
    if (!_.isEmpty(preferenceData.sub_categories)) {
      _.each(preferenceData.sub_categories, (subCategoryData, subCategory) => {
        encodedPreferences.push({
          name: preference,
          type: subCategory,
          // value stores strings
          value: subCategoryData.enable ? 'true' : 'false',
          enable_email_notification: preferenceData.enable_email,
          enable_product_notification: preferenceData.enable_product_notification
        });
      });
    } else {
      encodedPreferences.push({
        name: preference,
        enable_email_notification: preferenceData.enable_email,
        enable_product_notification: preferenceData.enable_product_notification
      });
    }
  });
  return encodedPreferences;
}

function decodePreferenceFormat(preferences) {
  if (_.isEmpty(preferences)) {
    return {};
  }
  let subscriptionPreferences = _.get(preferences, 'subscription_preferences', []);
  let decodedSubscriptionPreferences = {};
  let preferencesGroupedByName = _.groupBy(subscriptionPreferences, 'name');
  _.each(preferencesGroupedByName, (preferenceData, name) => {
    decodedSubscriptionPreferences[name] = {};
    decodedSubscriptionPreferences[name] = {
      enable_email: _.get(preferenceData[0], 'enable_email_notification', false),
      enable_product_notification: _.get(preferenceData[0], 'enable_product_notification', false)
    };
    if (_.some(preferenceData, 'type')) {
      decodedSubscriptionPreferences[name].sub_categories = {};
      _.each(preferenceData, (preference) => {
        const enableValue = _.get(preference, 'value', 'false');
        decodedSubscriptionPreferences[name].sub_categories[preference.type] = { enable: (enableValue == 'true') };
      });
    }
  });
  return {
    subscription_preferences: decodedSubscriptionPreferences,
    settings: decodeSettings(preferences)
  };
}

function decodeSettings(preferences) {
  let settings = _.get(preferences, 'settings', {});
  if (_.isEmpty(settings)) {
    return {};
  }
  return _.groupBy(settings, 'name');
}

function encodeSettings(settings) {
  return _.flattenDeep(_.values(settings));
}

export const AlertPreferenceAPI = (() => {
  return {
    get: () => {
      return fetch('/api/notifications_and_alerts/preferences', {
        method: 'GET',
        headers: getDefaultHeaders(),
        credentials: 'same-origin'
      }).
      then((response) => checkStatus(response, 'An error was encountered while getting alert preferences, please try again or contact support@socrata.com')).
      then((response) => response.json()).
      then((response) => {
        return decodePreferenceFormat(response.data);
      });
    },
    set: (preferences, settings) => {
      let encodePreferences = encodePreferenceFormat(preferences);
      return fetch('/api/notifications_and_alerts/preferences', {
        method: 'POST',
        headers: getDefaultHeaders(),
        credentials: 'same-origin',
        body: JSON.stringify({ subscription_preferences: encodePreferences, settings: encodeSettings(settings) })
      }).
      then((response) => checkStatus(response, 'An error was encountered while getting alert preferences, please try again or contact support@socrata.com')).
      then((response) => response.json()).
      then((response) => response.data);

    }
  };
})();

export default AlertPreferenceAPI;
