const dataTypes = {
  blob: 'socrata-icon-data',
  calendar_date: 'socrata-icon-date',
  checkbox: 'socrata-icon-check',
  dataset_link: 'socrata-icon-link',
  date: 'socrata-icon-date',
  document: 'socrata-icon-copy-document',
  drop_down_list: 'socrata-icon-list-2',
  email: 'socrata-icon-email',
  flag: 'socrata-icon-region',
  geospatial: 'socrata-icon-geo',
  html: 'socrata-icon-clear-formatting',
  line: 'socrata-icon-geo',
  link: 'socrata-icon-link',
  list: 'socrata-icon-list-numbered',
  location: 'socrata-icon-map',
  money: 'socrata-icon-number',
  multiline: 'socrata-icon-geo',
  multipoint: 'socrata-icon-geo',
  multipolygon: 'socrata-icon-geo',
  nested_table: 'socrata-icon-table',
  number: 'socrata-icon-number',
  object: 'socrata-icon-data',
  percent: 'socrata-icon-number',
  photo: 'socrata-icon-chart',
  point: 'socrata-icon-map',
  polygon: 'socrata-icon-geo',
  stars: null,
  text: 'socrata-icon-text',
  url: 'socrata-icon-link'
};

export function getIconForDataType(dataType) {
  if (dataTypes[dataType]) {
    return dataTypes[dataType];
  }

  console.warn(`Unknown icon for data type "${dataType}"`);
}
