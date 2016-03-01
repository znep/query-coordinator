const angular = require('angular');

function MixpanelService($log, MixpanelEvents, MixpanelProperties, $window) {
  // TODO: This file would be a good spot to ensure we only talk
  // to Mixpanel if it's enabled.

  const MISSING_PROP_VALUE = 'N/A';

  // These are properties that don't change once a page has loaded;
  var userId;
  var ownerId;
  var staticPageProperties;

  function init(pageMetadata, currentUser) {
    userId = _.get(currentUser, 'id', 'Not Logged In');
    ownerId = _.get(pageMetadata, 'ownerId', MISSING_PROP_VALUE);

    // Note that 'View Type' is hardcoded here, but outside of Data Lens,
    // this is the blist.dataset._mixpanelViewType
    staticPageProperties = {
      'Dataset Owner': ownerId,
      'Domain': $window.location.hostname,
      'Socrata Employee': _.includes(_.get(currentUser, 'flags'), 'admin'),
      'User Id': userId,
      'User Owns Dataset': ownerId === userId,
      'User Role Name': _.get(currentUser, 'roleName', MISSING_PROP_VALUE),
      'View Id': _.get(pageMetadata, 'pageId', MISSING_PROP_VALUE),
      'View Type': 'data lens'
    };
  }

  // Event name validation
  function validateEventName(eventName) {
    var valid = _.includes(MixpanelEvents, eventName);

    if (!valid) {
      $log.error(`Mixpanel payload validation failed: Unknown event name: "${eventName}"`);
    }

    return valid;
  }

  // Payload property validation
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

  // Note this is duplicated from util/mixpanel-analytics.js
  function registerUserProperties() {
    var properties = _.pick(
      staticPageProperties,
      'User Id',
      'Socrata Employee',
      'User Role Name',
      'Domain'
    );
    validateProperties(properties);

    if (_.isDefined($window.mixpanel)) {
      $window.mixpanel.register(properties);
      //set user ID to mixpanels user ID if not logged in
      $window.mixpanel.identify(userId === 'Not Logged In' ? $window.mixpanel.get_distinct_id() : userId);
    }
  }

  // Note this is duplicated from util/mixpanel-analytics.js
  function genericPagePayload() {
    return _.pick(
      staticPageProperties,
      'Dataset Owner',
      'User Owns Dataset',
      'View Id',
      'View Type',
      'On Page'
    );
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
    init: init,
    sendPayload: sendPayload
  };
}

angular.
  module('dataCards.services').
  service('MixpanelService', MixpanelService);
