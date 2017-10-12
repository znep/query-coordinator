const geo = [
  '.zip',
  '.json',
  '.geojson',
  '.kml',
  '.kmz'
];

export const enabledFileExtensions = [
  '.csv',
  '.tsv',
  '.xls',
  '.xlsx'
].concat(
  window.serverConfig.featureFlags.dataset_management_ui_enable_shapefile_upload ? geo : []
);

export function formatExpanation(format) {
  if (format === '.zip') {
    return '.zip (shapefile)';
  }
  if (format === '.json') {
    return '.json (GeoJSON)';
  }
  return format;
}
