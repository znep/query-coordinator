import _ from 'lodash';

const dataTypeMetadata = {
  blob: {
    icon: 'icon-data',
    sodaType: null
  },
  calendar_date: {
    icon: 'icon-date',
    sodaType: 'floating_timestamp'
  },
  checkbox: {
    icon: 'icon-check',
    sodaType: 'checkbox'
  },
  dataset_link: {
    icon: 'icon-link',
    sodaType: null
  },
  date: {
    icon: 'icon-date',
    sodaType: null
  },
  document: {
    icon: 'icon-copy-document',
    sodaType: null
  },
  drop_down_list: {
    icon: 'icon-list-2',
    sodaType: null
  },
  email: {
    icon: 'icon-email',
    sodaType: 'text'
  },
  flag: {
    icon: 'icon-region',
    sodaType: 'text'
  },
  geospatial: {
    icon: 'icon-geo',
    sodaType: null
  },
  html: {
    icon: 'icon-clear-formatting',
    sodaType: 'text'
  },
  line: {
    icon: 'icon-geo',
    sodaType: 'line'
  },
  link: {
    icon: 'icon-link',
    sodaType: 'text'
  },
  list: {
    icon: 'icon-list-numbered',
    sodaType: null
  },
  location: {
    icon: 'icon-map',
    sodaType: 'location'
  },
  money: {
    icon: 'icon-number',
    sodaType: 'money'
  },
  multiline: {
    icon: 'icon-geo',
    sodaType: 'multiline'
  },
  multipoint: {
    icon: 'icon-geo',
    sodaType: 'multipoint'
  },
  multipolygon: {
    icon: 'icon-geo',
    sodaType: 'multipolygon'
  },
  nested_table: {
    icon: 'icon-table',
    sodaType: null
  },
  number: {
    icon: 'icon-number',
    sodaType: 'number'
  },
  object: {
    icon: 'icon-data',
    sodaType: null
  },
  percent: {
    icon: 'icon-number',
    sodaType: 'number'
  },
  photo: {
    icon: 'icon-chart',
    sodaType: null
  },
  point: {
    icon: 'icon-map',
    sodaType: 'point'
  },
  polygon: {
    icon: 'icon-geo',
    sodaType: 'polygon'
  },
  stars: {
    icon: null,
    sodaType: 'number'
  },
  text: {
    icon: 'icon-text',
    sodaType: 'text'
  },
  url: {
    icon: 'icon-link',
    sodaType: 'text'
  }
};

function getIconClassForDataType(dataType) {
  const icon = _.get(dataTypeMetadata, `${dataType}.icon`);
  return icon ? `icon ${icon}` : '';
}

function getDocumentationLinkForDataType(dataType) {
  const sodaType = _.get(dataTypeMetadata, `${dataType}.sodaType`);
  return sodaType ? `https://dev.socrata.com/docs/datatypes/${sodaType}.html` : null;
}

export { getIconClassForDataType };
export { getDocumentationLinkForDataType };
