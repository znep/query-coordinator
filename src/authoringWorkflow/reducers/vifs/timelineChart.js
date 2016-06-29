import _ from 'lodash';

import vifs from '../../vifs';
import { forEachSeries, setValueOrDefaultValue, setValueOrDeleteProperty } from '../../helpers';
import {
  RECEIVE_METADATA,
  HANDLE_METADATA_ERROR,
  SET_DIMENSION,
  SET_MEASURE,
  SET_MEASURE_AGGREGATION,
  SET_TITLE,
  SET_DESCRIPTION,
  SET_BASE_COLOR,
  SET_LABEL_TOP,
  SET_LABEL_BOTTOM,
  SET_LABEL_LEFT,
  SET_LABEL_RIGHT,
  SET_X_AXIS_SCALING_MODE,
  SET_UNITS_ONE,
  SET_UNITS_OTHER
} from '../../actions';

export default function timelineChart(state, action) {
  if (_.isUndefined(state)) {
    return vifs().timelineChart;
  }

  state = _.cloneDeep(state);

  switch (action.type) {
    case SET_DIMENSION:
      forEachSeries(state, series => {
        setValueOrDefaultValue(series, 'dataSource.dimension.columnName', action.dimension, null);
      });
      break;

    case SET_TITLE:
      setValueOrDefaultValue(state, 'title', action.title, null);
      break;

    case SET_DESCRIPTION:
      setValueOrDefaultValue(state, 'description', action.description, null);
      break;

    case SET_MEASURE:
      forEachSeries(state, series => {
        series.dataSource.measure.columnName = action.measure;
      });
      break;

    case SET_MEASURE_AGGREGATION:
      forEachSeries(state, series => {
        series.dataSource.measure.aggregationFunction = action.measureAggregation;
      });
      break;

    case SET_BASE_COLOR:
      forEachSeries(state, series => {
        setValueOrDeleteProperty(series, 'color.primary', action.baseColor);
        setValueOrDeleteProperty(series, 'color.secondary', action.baseColor);
      });
      break;

    case SET_LABEL_TOP:
      setValueOrDeleteProperty(state, 'configuration.axisLabels.top', action.labelTop);
      break;

    case SET_LABEL_BOTTOM:
      setValueOrDeleteProperty(state, 'configuration.axisLabels.bottom', action.labelBottom);
      break;

    case SET_LABEL_LEFT:
      setValueOrDeleteProperty(state, 'configuration.axisLabels.left', action.labelLeft);
      break;

    case SET_LABEL_RIGHT:
      setValueOrDeleteProperty(state, 'configuration.axisLabels.right', action.labelRight);
      break;

    case SET_X_AXIS_SCALING_MODE:
      setValueOrDeleteProperty(state, 'configuration.xAxisScalingMode', action.xAxisScalingMode);
      break;

    case SET_UNITS_ONE:
      forEachSeries(state, series => {
        setValueOrDefaultValue(series, 'unit.one', action.one, 'Record');
      });
      break;

    case SET_UNITS_OTHER:
      forEachSeries(state, series => {
        setValueOrDefaultValue(series, 'unit.other', action.other, 'Records');
      });
      break;
  }

  return state;
}
