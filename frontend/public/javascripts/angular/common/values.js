const angular = require('angular');

// See also view_rights.rb
const VIEW_RIGHTS = [
  'add',
  'add_column',
  'delete',
  'delete_view',
  'grant',
  'read',
  'remove_column',
  'update_column',
  'update_view',
  'write'
];

// See also user_rights.rb
const USER_RIGHTS = [
  'approve_nominations',
  'change_configurations',
  'chown_datasets',
  'create_dashboards',
  'create_datasets',
  'create_pages',
  'create_story',
  'create_story_copy',
  'delete_story',
  'edit_dashboards',
  'edit_goals',
  'edit_nominations',
  'edit_others_datasets',
  'edit_pages',
  'edit_sdp',
  'edit_site_theme',
  'edit_story',
  'edit_story_title_desc',
  'feature_items',
  'federations',
  'manage_approval',
  'manage_provenance',
  'manage_spatial_lens',
  'manage_stories',
  'manage_story_collaborators',
  'manage_story_public_version',
  'manage_story_visibility',
  'manage_users',
  'moderate_comments',
  'short_session',
  'view_all_dataset_status_logs',
  'view_dashboards',
  'view_domain',
  'view_goals',
  'view_others_datasets',
  'view_story',
  'view_unpublished_story'
];

// This is duplicated in mixpanel-analytics.js and common/mixpanel.js
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
  'Filtered Assets by Lasted Updated Date',
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

// This is duplicated in mixpanel-analytics.js and common/mixpanel.js
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

function asObject(stringArray) {
  return _.zipObject(
    _.invokeMap(stringArray, String.prototype.toUpperCase),
    stringArray
  );
}

angular.module('socrataCommon.values', []).
  value('MixpanelEvents', MIXPANEL_EVENTS).
  value('MixpanelProperties', MIXPANEL_PROPERTIES).
  value('ViewRights', asObject(VIEW_RIGHTS)).
  value('UserRights', asObject(USER_RIGHTS));
