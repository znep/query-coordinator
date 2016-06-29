import { translate, translateGroup } from '../I18n';

export default {
  format: {
    type: 'visualization_interchange_format',
    version: 2
  },
  configuration: {
    baseLayerUrl: null,
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
      type: 'featureMap',
      unit: {
        one: translate('visualizations.common.units.one'),
        other: translate('visualizations.common.units.other')
      }
    }
  ],
  title: ''
};
