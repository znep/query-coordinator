const angular = require('angular');

function MixpanelService($log, MixpanelEvents, MixpanelProperties, $window) {
  var currentUser = $window.currentUser;
  var pageMetadata = $window.pageMetadata;

  // TODO: This file would be a good spot to ensure we only talk
  // to Mixpanel if it's enabled.

  // Note this is duplicated from util/mixpanel-analytics.js
  function registerUserProperties() {
    var userId = _.get(currentUser, 'id', 'Not Logged In');
    var isSocrata = _.includes(_.get(currentUser, 'flags'), 'admin');
    var userRoleName = _.get(currentUser, 'roleName', 'N/A');
    var domain = $window.location.hostname;

    if (_.isDefined($window.mixpanel)) {
      $window.mixpanel.register({
        'User Id': userId,
        'Socrata Employee': isSocrata,
        'User Role Name': userRoleName,
        'Domain': domain
      });
      //set user ID to mixpanels user ID if not logged in
      $window.mixpanel.identify(userId === 'Not Logged In' ? $window.mixpanel.get_distinct_id() : userId);
    }
  }

  // Note this is duplicated from util/mixpanel-analytics.js
  function genericPagePayload() {
    var userId = _.get(currentUser, 'id', 'Not Logged In');
    var datasetOwner = _.get(pageMetadata, 'ownerId', 'N/A');
    var viewType = _.get(pageMetadata, 'name', 'N/A');
    var viewId = _.get(pageMetadata, 'pageId', 'N/A');
    var userOwnsDataset = datasetOwner === userId;
    var pathName = $window.location.pathname;

    return {
      'Dataset Owner': datasetOwner,
      'User Owns Dataset': userOwnsDataset,
      'View Id': viewId,
      'View Type': viewType,
      'On Page': pathName
    };
  }

  function validateEventName(eventName) {
    var valid = _.includes(MixpanelEvents, eventName);

    if (!valid) {
      $log.error(`Mixpanel payload validation failed: Unknown event name: "${eventName}"`);
    }

    return valid;
  }

  function validateProperties(properties) {
    var valid = true;

    _.forEach(properties, function(value, key) {
      if (_.isObject(value)) {
        validateProperties(value);
      } else {
        valid = _.includes(MixpanelProperties, key);

        if (!valid) {
          $log.error(`Mixpanel payload validation failed: Unknown property "${key}"`);
        }

        return valid;
      }
    });

    return valid;
  }

  function sendPayload(eventName, properties) {
    if (_.isDefined($window.mixpanel)) {
      // Make sure cookies are up-to-date
      registerUserProperties();

      // Merge custom properties with properties we always want to track
      var mergedProperties = _.extend(genericPagePayload(), properties);

      // Track!
      validateEventName(eventName);
      validateProperties(mergedProperties);

      $window.mixpanel.track(eventName, mergedProperties);
    }
  }

  return {
    sendPayload: sendPayload
  };
}

angular.
  module('dataCards.services').
  service('MixpanelService', MixpanelService);
