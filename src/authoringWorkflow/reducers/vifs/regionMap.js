import _ from 'lodash';
import utils from 'socrata-utils';

import { translate } from '../../../I18n';
import vifs from '../../vifs';
import {
  forEachSeries,
  getValidVifFilters,
  setStringValueOrDefaultValue,
  setUnits
} from '../../helpers';

import {
  RESET_STATE,
  RECEIVE_METADATA,
  SET_DIMENSION,
  SET_FILTERS,
  SET_MEASURE,
  SET_MEASURE_AGGREGATION,
  SET_COMPUTED_COLUMN,
  SET_COLOR_SCALE,
  SET_TITLE,
  SET_DESCRIPTION,
  SET_BASE_LAYER,
  SET_BASE_LAYER_OPACITY,
  SET_UNIT_ONE,
  SET_UNIT_OTHER,
  SET_CENTER_AND_ZOOM,
  SET_SHAPEFILE,
  SET_DOMAIN,
  SET_DATASET_UID,
  SET_NEGATIVE_COLOR,
  SET_ZERO_COLOR,
  SET_POSITIVE_COLOR,
  SET_VIEW_SOURCE_DATA_LINK,
  SET_SHAPEFILE_UID,
  SET_SHAPEFILE_PRIMARY_KEY,
  SET_SHAPEFILE_GEOMETRY_LABEL
} from '../../actions';

export default function regionMap(state, action) {
  if (_.isUndefined(state)) {
    return vifs().regionMap;
  }

  state = _.cloneDeep(state);

  switch (action.type) {
    case RESET_STATE:
      state = vifs().regionMap;
      break;

    case RECEIVE_METADATA:
      forEachSeries(state, series => {
        setUnits(series, action);
      });
      break;

    case SET_DOMAIN:
      forEachSeries(state, series => {
        setStringValueOrDefaultValue(series, 'dataSource.domain', action.domain, null);
      });
      break;

    case SET_DATASET_UID:
      forEachSeries(state, series => {
        setStringValueOrDefaultValue(series, 'dataSource.datasetUid', action.datasetUid, null);
      });
      break;

    case SET_FILTERS:
      forEachSeries(state, series => {
        _.set(series, 'dataSource.filters', getValidVifFilters(action.filters));
      });
      break;

    case SET_DIMENSION:
      _.unset(state, 'configuration.mapCenterAndZoom');

      forEachSeries(state, series => {
        setStringValueOrDefaultValue(series, 'dataSource.dimension.columnName', action.dimension, null);
      });
      break;

    case SET_TITLE:
      setStringValueOrDefaultValue(state, 'title', action.title, null);
      break;

    case SET_DESCRIPTION:
      setStringValueOrDefaultValue(state, 'description', action.description, null);
      break;

    case SET_VIEW_SOURCE_DATA_LINK:
      _.set(state, 'configuration.viewSourceDataLink', action.viewSourceDataLink);
      break;

    case SET_MEASURE:
      forEachSeries(state, series => {
        var aggregationFunction = series.dataSource.measure.aggregationFunction;

        setStringValueOrDefaultValue(series, 'dataSource.measure.columnName', action.measure, null);

        if (_.isNull(action.measure)) {
          series.dataSource.measure.aggregationFunction = 'count';
        } else if (aggregationFunction === 'count') {
          series.dataSource.measure.aggregationFunction = 'sum';
        }
      });
      break;

    case SET_MEASURE_AGGREGATION:
      forEachSeries(state, series => {
        setStringValueOrDefaultValue(series, 'dataSource.measure.aggregationFunction', action.measureAggregation, null);
      });
      break;

    case SET_COMPUTED_COLUMN:
      _.set(state, 'configuration.computedColumnName', action.computedColumn);
      break;

    case SET_SHAPEFILE:
      _.set(state, 'configuration.shapefile.uid', action.shapefileUid);
      _.set(state, 'configuration.shapefile.primaryKey', action.shapefilePrimaryKey);
      _.set(state, 'configuration.shapefile.geometryLabel', action.shapefileGeometryLabel);
      break;

    case SET_SHAPEFILE_UID:
      _.set(state, 'configuration.shapefile.uid', action.shapefileUid);
      break;

    case SET_SHAPEFILE_PRIMARY_KEY:
      _.set(state, 'configuration.shapefile.primaryKey', action.shapefilePrimaryKey);
      break;

    case SET_SHAPEFILE_GEOMETRY_LABEL:
      _.set(state, 'configuration.shapefile.geometryLabel', action.shapefileGeometryLabel);
      break;

    case SET_BASE_LAYER:
      _.set(state, 'configuration.baseLayerUrl', action.baseLayer);
      break;

    case SET_BASE_LAYER_OPACITY:
      _.set(state, 'configuration.baseLayerOpacity', parseFloat(action.baseLayerOpacity));
      break;

    case SET_COLOR_SCALE:
      _.set(state, 'configuration.legend.type', 'continuous');
      _.set(state, 'configuration.legend.negativeColor', action.negativeColor);
      _.set(state, 'configuration.legend.zeroColor', action.zeroColor);
      _.set(state, 'configuration.legend.positiveColor', action.positiveColor);
      break;

    case SET_NEGATIVE_COLOR:
      _.set(state, 'configuration.legend.negativeColor', action.negativeColor);
      break;

    case SET_ZERO_COLOR:
      _.set(state, 'configuration.legend.zeroColor', action.zeroColor);
      break;

    case SET_POSITIVE_COLOR:
      _.set(state, 'configuration.legend.positiveColor', action.positiveColor);
      break;

    case SET_UNIT_ONE:
      forEachSeries(state, series => {
        setStringValueOrDefaultValue(series, 'unit.one', action.one, translate('visualizations.common.unit.one'));
      });
      break;

    case SET_UNIT_OTHER:
      forEachSeries(state, series => {
        setStringValueOrDefaultValue(series, 'unit.other', action.other, translate('visualizations.common.unit.other'));
      });
      break;

    case SET_CENTER_AND_ZOOM:
      _.set(state, 'configuration.mapCenterAndZoom', action.centerAndZoom);
      break;
  }

  return state;
}
