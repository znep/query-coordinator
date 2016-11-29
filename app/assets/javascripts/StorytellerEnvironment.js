// Copies select properties off the window object as an encapsulated environment.

import _ from 'lodash';

const envProperties = [
  'AIRBRAKE',
  'CORE_SERVICE_APP_TOKEN',
  'CSRF_TOKEN',
  'CURRENT_USER',
  'CURRENT_USER_STORY_AUTHORIZATION',
  'CUSTOM_THEMES',
  'DEFAULT_THEMES',
  'DOWNTIMES',
  'EMBED_CODE_SANDBOX_IFRAME_ALLOWANCES',
  'ENABLE_DEPRECATED_USER_SEARCH_API',
  'ENABLE_FILTERED_TABLES_IN_AX',
  'ENABLE_GETTY_IMAGES_GALLERY',
  'ENVIRONMENT',
  'IMAGES',
  'IS_GOAL',
  'IS_STORY_PUBLISHED',
  'OP_CATEGORY_UID',
  'OP_DASHBOARD_UID',
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
