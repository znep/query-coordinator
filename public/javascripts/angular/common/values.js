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

function asObject(stringArray) {
  return _.zipObject(
    _.invoke(stringArray, String.prototype.toUpperCase),
    stringArray
  );
}

angular.module('socrataCommon.values', []).
  value('ViewRights', asObject(VIEW_RIGHTS)).
  value('UserRights', asObject(USER_RIGHTS));
