import _ from 'lodash';

export const enabledFileExtensions = _.compact([
  '.csv',
  '.tsv',
  '.xls',
  '.xlsx',
  window.serverConfig.featureFlags.dataset_management_ui_enable_shapefile_upload ? '.zip' : null
]);

export function formatExpanation(format) {
  if (format === '.zip') {
    return '.zip (shapefile)';
  }
  return format;
}
