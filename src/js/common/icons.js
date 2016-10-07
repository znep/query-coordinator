const dataTypes = {
  blob: 'icon-data',
  calendar_date: 'icon-date',
  checkbox: 'icon-check',
  dataset_link: 'icon-link',
  date: 'icon-date',
  document: 'icon-copy-document',
  drop_down_list: 'icon-list-2',
  email: 'icon-email',
  flag: 'icon-region',
  geospatial: 'icon-geo',
  html: 'icon-clear-formatting',
  line: 'icon-geo',
  link: 'icon-link',
  list: 'icon-list-numbered',
  location: 'icon-map',
  money: 'icon-number',
  multiline: 'icon-geo',
  multipoint: 'icon-geo',
  multipolygon: 'icon-geo',
  nested_table: 'icon-table',
  number: 'icon-number',
  object: 'icon-data',
  percent: 'icon-number',
  photo: 'icon-chart',
  point: 'icon-map',
  polygon: 'icon-geo',
  stars: null,
  text: 'icon-text',
  url: 'icon-link'
};

export function getIconForDataType(dataType) {
  if (dataTypes[dataType]) {
    return dataTypes[dataType];
  }

  console.warn(`Unknown icon for data type "${dataType}"`);
}
