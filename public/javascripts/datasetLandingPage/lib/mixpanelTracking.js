import _ from 'lodash';
import mixpanel from 'mixpanel-browser';

var sessionData = window.sessionData;
var config = window.mixpanelConfig;

// Mixpanel constants
// This is duplicated in angular/common/values.js and util/mixpanel-analytics.js
var MIXPANEL_EVENTS = [
  'Changed Render Type Options',
  'Chose Visualization Type',
  'Cleared Facets',
  'Cleared Search Field',
  'Clicked API Docs Link',
  'Clicked Catalog Result',
  'Clicked Featured View',
  'Clicked Footer Item',
  'Clicked Header Item',
  'Clicked Next in Tour',
  'Clicked Sidebar Option',
  'Clicked Socrata News Link',
  'Clicked Pane in Sidebar',
  'Clicked a Related View',
  'Clicked to Add a Featured Item',
  'Clicked to Edit a Featured Item',
  'Clicked to Remove a Featured Item',
  'Clicked to Show More Views',
  'Closed Tour',
  'Created a Data Lens',
  'Contacted Dataset Owner',
  'Copied API Link',
  'Copied OData Link',
  'Downloaded Data',
  'Edited Metadata',
  'Encountered Error Message',
  'Expanded Column Info',
  'Expanded Details',
  'Ingress: Started Wizard Page',
  'Ingress: Left Wizard Page',
  'Navigated to Gridpage',
  'Opened Goal Chart',
  'Saved a Featured Item',
  'Shared Dataset',
  'Used Search Facets',
  'Used Search Field',
  'Viewed Dataset Statistics'
];

// This is duplicated in angular/common/values.js and util/mixpanel-analytics.js
var MIXPANEL_PROPERTIES = [
  'Catalog Version',
  'Chart/Map Type',
  'Click Position',
  'Content Type',
  'Dataset Owner',
  'Display Type',
  'Domain',
  'Expanded Target',
  'Facet Name',
  'Facet Type',
  'Facet Type Name',
  'Facet Value',
  'Footer Item Type',
  'From Page',
  'Header Item Type',
  'Ingress Step',
  'IP',
  'Item Position',
  'Item Type',
  'Limit',
  'Message Shown',
  'Name',
  'New URL',
  'Next Action',
  'Page Number',
  'Pane Name',
  'On Page',
  'Product',
  'Properties',
  'Provider',
  'Query',
  'Related View Id',
  'Related View Type',
  'Render Type',
  'Result Ids',
  'Result Number',
  'Request Id',
  'Session Id',
  'Sidebar Name',
  'Socrata Employee',
  'Step in Tour',
  'Time Since Page Opened (sec)',
  'Tour',
  'Total Steps in Tour',
  'Type',
  'URL',
  'User Id',
  'User Owns Dataset',
  'User Role Name',
  'View Id',
  'View Type',
  'Visualization Type',
  'Wizard Page',
  'Wizard Page Visit Number'
];

// These are properties that don't change once a page has loaded;
var staticPageProperties = {
  'Dataset Owner': sessionData.ownerId,
  'Domain': window.location.hostname,
  'On Page': window.location.pathname,
  'Socrata Employee': sessionData.socrataEmployee,
  'User Id': sessionData.userId,
  'User Role Name': sessionData.userRoleName,
  'User Owns Dataset': sessionData.userOwnsDataset,
  'View Id': sessionData.viewId,
  'View Type': 'DSLP'
};

// Event name validation
function validateEventName(eventName) {
  var valid = _.includes(MIXPANEL_EVENTS, eventName);

  if (!valid) {
    console.error(`Mixpanel payload validation failed: Unknown event name: "${eventName}"`);
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
      valid = _.includes(MIXPANEL_PROPERTIES, key);

      if (!valid) {
        console.error(`Mixpanel payload validation failed: Unknown property "${key}"`);
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

  if (!_.isUndefined(mixpanel)) {
    mixpanel.register(properties);

    // Set user ID to mixpanels user ID if not logged in
    var userId = sessionData.userId;
    mixpanel.identify(userId === 'Not Logged In' ? mixpanel.get_distinct_id() : userId);
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
  if (!_.isUndefined(mixpanel)) {
    // Make sure cookies are up-to-date
    registerUserProperties();

    // Merge custom properties with properties we always want to track
    var mergedProperties = _.extend(genericPagePayload(), properties);

    // Track!
    validateEventName(eventName);
    validateProperties(mergedProperties);

    mixpanel.track(eventName, mergedProperties);
  }
}

// Initialize Mixpanel
// Default is no tracking, no cookies and no events saved
if (!config.disable) {
  mixpanel.init(config.token, config.options);
}

module.exports = {
  sendPayload: config.disable ? _.noop : sendPayload
};
