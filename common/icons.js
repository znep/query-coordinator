const dataTypes = {
  blob: 'data',
  calendar_date: 'date',
  checkbox: 'check',
  dataset_link: 'link',
  date: 'date',
  document: 'copy-document',
  drop_down_list: 'list-2',
  email: 'email',
  flag: 'region',
  geospatial: 'geo',
  html: 'clear-formatting',
  line: 'geo',
  link: 'link',
  list: 'list-numbered',
  location: 'map',
  money: 'dollar',
  multiline: 'geo',
  multipoint: 'geo',
  multipolygon: 'geo',
  nested_table: 'table',
  number: 'number',
  object: 'data',
  percent: 'number',
  photo: 'chart',
  point: 'map',
  polygon: 'geo',
  stars: null,
  text: 'text',
  url: 'link'
};

export function getIconForDataType(dataType) {
  if (dataTypes[dataType]) {
    return dataTypes[dataType];
  }

  console.warn(`Unknown icon for data type "${dataType}"`); //eslint-disable-line no-console
}
