import _ from 'lodash';
import mixpanelBrowser from 'mixpanel-browser';

const sessionData = window.sessionData;
const config = window.mixpanelConfig;

// Mixpanel constants
// This is duplicated in angular/common/values.js and util/mixpanel-analytics.js
const MIXPANEL_EVENTS = [
  'Changed Render Type Options',
  'Chose Visualization Type',
  'Cleared Facets',
  'Cleared Search Field',
  'Clicked a Related View',
  'Clicked API Docs Link',
  'Clicked Catalog Result',
  'Clicked Featured View',
  'Clicked Footer Item',
  'Clicked Header Item',
  'Clicked Pane in Sidebar',
  'Clicked Sidebar Option',
  'Clicked Socrata News Link',
  'Clicked to Add a Featured Item',
  'Clicked to Edit a Featured Item',
  'Clicked to Remove a Featured Item',
  'Clicked to Show More Views',
  'Contacted Dataset Owner',
  'Copied API Link',
  'Copied OData Link',
  'Created a Data Lens',
  'Downloaded Data',
  'Edited Metadata',
  'Encountered Error Message',
  'Expanded Column Info',
  'Expanded Details',
  'Filtered Assets by Asset Type',
  'Filtered Assets by Authority',
  'Filtered Assets by Category',
  'Filtered Assets by Custom Metadata',
  'Filtered Assets by Last Updated Date',
  'Filtered Assets by Owner',
  'Filtered Assets by Tag',
  'Filtered Assets by Visibility',
  'Filtered Assets to Only Recently Viewed',
  'Ingress: Left Wizard Page',
  'Ingress: Started Wizard Page',
  'Navigated to Gridpage',
  'Opened Goal Chart',
  'Saved a Featured Item',
  'Shared Dataset',
  'Sorted Assets By Asset Type',
  'Sorted Assets By Category',
  'Sorted Assets By Last Updated Date',
  'Sorted Assets By Name',
  'Sorted Assets By Owner',
  'Used Asset Search Field',
  'Used Search Facets',
  'Used Search Field',
  'Viewed Dataset Statistics'
];

// This is duplicated in angular/common/values.js and util/mixpanel-analytics.js
const MIXPANEL_PROPERTIES = [
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
  'Result Count',
  'Result Ids',
  'Result Number',
  'Request Id',
  'Session Id',
  'Sidebar Name',
  'Socrata Employee',
  'Time Since Page Opened (sec)',
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
const staticPageProperties = {
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

// Event name validation (return value should be ignored)
function validateEventName(eventName) {
  const valid = _.includes(MIXPANEL_EVENTS, eventName);

  if (!valid) {
    console.warn(`Mixpanel payload validation failed: Unknown event name: "${eventName}"`);
  }

  return valid;
}

// Payload property validation (return value should be ignored)
function validateProperties(properties) {
  let valid = true;

  if (_.isObject(properties) && !_.isArray(properties)) {
    _.forEach(properties, (value, key) => {
      if (_.isObject(value)) {
        validateProperties(value);
      } else {
        valid = _.includes(MIXPANEL_PROPERTIES, key);

        if (!valid) {
          console.warn(`Mixpanel payload validation failed: Unknown property: "${key}"`);
        }

        return valid;
      }
    });
  }

  return valid;
}

// Note this is duplicated from util/mixpanel-analytics.js
function registerUserProperties() {
  const properties = _.pick(
    staticPageProperties,
    'User Id',
    'Socrata Employee',
    'User Role Name',
    'Domain'
  );
  validateProperties(properties);

  if (!_.isUndefined(mixpanelBrowser)) {
    mixpanelBrowser.register(properties);

    // Set user ID to mixpanels user ID if not logged in
    const userId = sessionData.userId;
    mixpanelBrowser.identify(userId === 'Not Logged In' ? mixpanelBrowser.get_distinct_id() : userId);

    // set the profile information about the user
    if (_.isObject(sessionData)) {
      mixpanelBrowser.people.set({
        '$email': _.get(sessionData, 'email'),
        '$role:': _.get(sessionData, 'userRoleName'),
        '$id': _.get(sessionData, 'ownerId'),
        '$domain': window.location.hostname,
        '$socrataEmployee': _.get(sessionData, 'socrataEmployee')
      });
    }
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
  if (!_.isUndefined(mixpanelBrowser)) {
    // Make sure cookies are up-to-date
    registerUserProperties();

    // Merge custom properties with properties we always want to track
    const mergedProperties = _.extend(genericPagePayload(), properties);

    // Track!
    validateEventName(eventName);
    validateProperties(mergedProperties);

    mixpanelBrowser.track(eventName, mergedProperties);
  }
}

// Initialize Mixpanel
// Default is no tracking, no cookies and no events saved
if (!config.disable && !_.isUndefined(mixpanelBrowser)) {
  mixpanelBrowser.init(config.token, config.options);
} else {
  console.warn('Mixpanel has not been loaded or has been disabled.');
}

export default { sendPayload: config.disable ? _.noop : sendPayload };
