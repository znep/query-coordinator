export const DEFAULT_PAGE_SIZE = 10;
export const API_URL = '/api/activity_log';
export const DOWNLOAD_URL = '/api/activity_log.csv';
export const MOBILE_BREAKPOINT = 768;
export const DATE_FORMAT = 'YYYY-MM-DD';
export const DATA_UPDATE_METHODS = [
  'Import',
  'Upsert',
  'Replace',
  'Delete',
  'Restore',
  'Sync',
  'Unknown',
  'Append',
  'PrepareCuratedRegion',
  'AddRegionColumn'
];
export const DATA_UPDATE_STATUSES = [
  'Started',
  'InProgress',
  'Success',
  'SuccessWithDataErrors',
  'Failure'
];
export const EVENT_TYPES = [
  'ApprovalChanged',
  'AssetCreated',
  'AssetDeleted',
  'AssetMetadataChanged',
  'AssetOwnerChanged',
  'AssetPermissionsChanged',
  'CollaboratorAdded',
  'CollaboratorRemoved',
  ...(DATA_UPDATE_STATUSES.map(s => `DataUpdate.${s}`)),
  'DraftCreated',
  'DraftDeleted',
  'DraftPublished',
  'UserAdded',
  'UserRemoved',
  'UserRoleChanged'
];
