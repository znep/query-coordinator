import { translate, translateGroup } from '../I18n';
import { BASE_LAYERS } from '../constants';

export default {
  format: {
    type: 'visualization_interchange_format',
    version: 2
  },
  configuration: {
    baseLayerUrl: BASE_LAYERS[0].value,
    baseLayerOpacity: 0.8,
    datasetMetadata: false,
    pointColor: '#eb6900',
    flyoutTitleColumnName: null,
    hover: true,
    localization: translateGroup('visualizations.feature_map'),
    locateUser: false,
    panAndZoom: true,
    useOriginHost: false
  },
  description: '',
  series: [
    {
      color: {},
      dataSource: {
        datasetUid: null,
        dimension: {
          columnName: null,
          aggregationFunction: null
        },
        domain: '',
        measure: {
          columnName: null,
          aggregationFunction: null
        },
        type: 'socrata.soql',
        filters: []
      },
      label: null,
      type: 'featureMap'
    }
  ],
  title: ''
};
