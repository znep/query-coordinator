// Copies select properties off the window object as an encapsulated environment.

import _ from 'lodash';

const envProperties = [
  'AIRBRAKE',
  'APPROVALS_SETTINGS',
  'CORE_SERVICE_APP_TOKEN',
  'CORE_VIEW',
  'CURRENT_USER',
  'CURRENT_USER_STORY_AUTHORIZATION',
  'CUSTOM_THEMES',
  'DEFAULT_THEMES',
  'DOWNTIMES',
  'EMBED_CODE_SANDBOX_IFRAME_ALLOWANCES',
  'ENVIRONMENT',
  'IMAGES',
  'IS_GOAL',
  'IS_STORY_PUBLISHED',
  'OP_CATEGORY_UID',
  'OP_DASHBOARD_LIST',
  'OP_DASHBOARD_UID',
  /*
   * Document: A Storyteller-based file upload; saved into our documents database table.
   * Asset: A Core-based file upload; saved into MetaDB's assets database table.
   *
   * This is an object, keyed by asset ID, and mapped to the document ID.
   *
   * It's used to migrate Open Performance images from Core to Storyteller
   * in our GoalMigrationRunner.js.
   */
  'OP_GOAL_DOCUMENT_IDS_BY_ASSET_IDS',
  'OP_GOAL_IS_CONFIGURED',
  'OP_GOAL_NARRATIVE_MIGRATION_METADATA',
  'PRIMARY_OWNER_UID',
  'PUBLISHED_STORY_DATA',
  'RELATIVE_URL_ROOT',
  'STORY_DATA',
  'STORY_UID',
  'STORY_VIEW_URL',
  'THEMES_ASSET_PATH',
  'TRANSLATIONS'
];

const environment = _.reduce(envProperties, (acc, prop) => {
  acc[prop] = window[prop];
  return acc;
}, {});

export default environment;
