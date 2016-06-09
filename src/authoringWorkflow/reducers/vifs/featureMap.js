import _ from 'lodash';

import vifs from '../../vifs';
import { forEachSeries, setValueOrDefaultValue } from '../../helpers';
import {
  RECEIVE_METADATA,
  HANDLE_METADATA_ERROR,
  SET_TITLE,
  SET_DESCRIPTION,
  SET_DIMENSION,
  SET_POINT_COLOR,
  SET_POINT_OPACITY,
  SET_BASE_LAYER,
  SET_BASE_LAYER_OPACITY,
  SET_UNITS_ONE,
  SET_UNITS_OTHER,
  SET_FLYOUT_TITLE
} from '../../actions';

export default function featureMap(state, action) {
  if (_.isUndefined(state)) {
    return vifs().featureMap;
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

    case SET_POINT_COLOR:
      _.set(state, 'configuration.pointColor', action.pointColor);
      break;

    case SET_POINT_OPACITY:
      var opacity = parseFloat(action.pointOpacity);
      _.set(state, 'configuration.pointOpacity', _.isFinite(opacity) ? opacity : null);
      break;

    case SET_BASE_LAYER:
      _.set(state, 'configuration.baseLayerUrl', action.baseLayer);
      break;

    case SET_BASE_LAYER_OPACITY:
      var opacity = parseFloat(action.baseLayerOpacity);
      _.set(state, 'configuration.baseLayerOpacity', _.isFinite(opacity) ? opacity : null);
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

    case SET_FLYOUT_TITLE:
      _.set(state, 'configuration.flyoutTitleColumnName', action.flyoutTitleColumnName);
      break;
  }

  return state;
}
