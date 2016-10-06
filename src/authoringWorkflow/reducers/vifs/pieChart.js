import _ from 'lodash';
import utils from 'socrata-utils';

import { translate } from '../../../I18n';
import vifs from '../../vifs';
import {
  forEachSeries,
  setStringValueOrDefaultValue,
  setBooleanValueOrDefaultValue,
  setValueOrDeleteProperty,
  setUnits,
  isNonEmptyString
} from '../../helpers';

import {
  RECEIVE_METADATA,
  SET_DATASET_UID,
  SET_DESCRIPTION,
  SET_DIMENSION,
  SET_DOMAIN,
  SET_MEASURE,
  SET_MEASURE_AGGREGATION,
  SET_ORDER_BY,
  SET_TITLE,
  SET_UNIT_ONE,
  SET_UNIT_OTHER,
  SET_VIEW_SOURCE_DATA_LINK
} from '../../actions';

export default function pieChart(state, action) {
  if (_.isUndefined(state)) {
    return vifs().pieChart;
  }

  state = _.cloneDeep(state);

  switch (action.type) {
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

    case SET_DIMENSION:
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

        series.dataSource.measure.columnName = action.measure;

        if (_.isNull(action.measure)) {
          series.dataSource.measure.aggregationFunction = 'count';
        } else if (aggregationFunction === 'count') {
          series.dataSource.measure.aggregationFunction = 'sum';
        }
      });
      break;

    case SET_MEASURE_AGGREGATION:
      forEachSeries(state, series => {
        series.dataSource.measure.aggregationFunction = action.measureAggregation;
      });
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

    case SET_ORDER_BY:
      forEachSeries(state, series => {
        _.set(series, 'dataSource.orderBy', _.cloneDeep(action.orderBy));
      });
      break;
  }

  return state;
}
