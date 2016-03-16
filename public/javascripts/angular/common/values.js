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

// This is duplicated in mixpanel-analytics.js
const MIXPANEL_EVENTS = [
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
  'Clicked Pane in Sidebar',
  'Closed Tour',
  'Encountered Error Message',
  'Opened Goal Chart',
  'Used Search Facets',
  'Used Search Field',
  'Clicked Socrata News Link'
];

// This is duplicated in mixpanel-analytics.js
const MIXPANEL_PROPERTIES = [
  'Catalog Version',
  'Chart/Map Type',
  'Click Position',
  'Dataset Owner',
  'Domain',
  'Facet Name',
  'Facet Type',
  'Facet Type Name',
  'Facet Value',
  'Footer Item Type',
  'Header Item Type',
  'Ingress Step',
  'IP',
  'Limit',
  'Message Shown',
  'Name',
  'New URL',
  'Page Number',
  'Pane Name',
  'On Page',
  'Product',
  'Properties',
  'Query',
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
  'Visualization Type'
];

function asObject(stringArray) {
  return _.zipObject(
    _.invoke(stringArray, String.prototype.toUpperCase),
    stringArray
  );
}

angular.module('socrataCommon.values', []).
  value('MixpanelEvents', MIXPANEL_EVENTS).
  value('MixpanelProperties', MIXPANEL_PROPERTIES).
  value('ViewRights', asObject(VIEW_RIGHTS)).
  value('UserRights', asObject(USER_RIGHTS));
