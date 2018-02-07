export const DOMAIN_RIGHTS = {
  CHOWN_DATASETS: 'chown_datasets'
};

export const ACCESS_LEVELS = {
  CONTRIBUTOR: 'contributor',
  CURRENT_OWNER: 'current_owner',
  OWNER: 'owner',
  VIEWER: 'viewer'
};

export const ACCESS_LEVEL_VERSIONS = {
  PUBLISHED: 'published',
  DRAFT: 'draft',
  ALL: 'all'
};

export const AUDIENCE_SCOPES = {
  PRIVATE: 'private',
  PUBLIC: 'public',
  ORGANIZATION: 'organization'
};

export const USER_TYPES = {
  INTERACTIVE: 'interactive',
  TEAM: 'team',
  USER: 'user'
};

export const CATALOG_SEARCH_DEBOUNCE_MILLISECONDS = 250;
export const TOAST_NOTIFICATION_MILLISECONDS = 3000;

export const MODES = {
  CHANGE_AUDIENCE: 'change_audience',
  CHANGE_OWNER: 'change_owner',
  MANAGE_COLLABORATORS: 'manage_collaborators',
  PUBLISH: 'publish'
};

export const OWNER_ACCESS_LEVEL = {
  name: ACCESS_LEVELS.CURRENT_OWNER,
  version: ACCESS_LEVEL_VERSIONS.ALL
};

export const ALL_VIEWER_ACCESS_LEVEL = {
  name: ACCESS_LEVELS.VIEWER,
  version: ACCESS_LEVEL_VERSIONS.ALL
};

export const PUBLISHED_VIEWER_ACCESS_LEVEL = {
  name: ACCESS_LEVELS.VIEWER,
  version: ACCESS_LEVEL_VERSIONS.PUBLISHED
};
