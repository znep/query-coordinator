import _ from 'lodash';
import utils from 'socrata-utils';

import { translate } from '../../I18n';
import vifs from '../../vifs';
import { forEachSeries, setValueOrDeleteProperty, setValueOrDefaultValue, isNonEmptyString } from '../../helpers';
import {
  RECEIVE_METADATA,
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

export default function histogram(state, action) {
  if (_.isUndefined(state)) {
    return vifs().histogram;
  }

  state = _.cloneDeep(state);

  switch (action.type) {
    case RECEIVE_METADATA:
      forEachSeries(state, series => {
        let rowDisplayUnit = _.get(action, 'phidippidesMetadata.rowDisplayUnit', translate('visualizations.common.units.one'));
        setValueOrDefaultValue(series, 'unit.one', rowDisplayUnit);
        setValueOrDefaultValue(series, 'unit.other', utils.pluralize(rowDisplayUnit));
      });
      break;

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

        if (_.isNull(action.measure)) {
          series.dataSource.measure.aggregationFunction = 'count';
        } else {
          series.dataSource.measure.aggregationFunction = null;
        }
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
        setValueOrDefaultValue(series, 'unit.one', action.one, translate('visualizations.common.units.one'));
      });
      break;

    case SET_UNITS_OTHER:
      forEachSeries(state, series => {
        setValueOrDefaultValue(series, 'unit.other', action.other, translate('visualizations.common.units.other'));
      });
      break;
  }

  return state;
}
