import _ from 'lodash';
import utils from 'socrata-utils';

import { translate } from '../../../I18n';
import vifs from '../../vifs';
import { forEachSeries, setValueOrDefaultValue } from '../../helpers';
import {
  RECEIVE_METADATA,
  SET_TITLE,
  SET_DESCRIPTION,
  SET_DIMENSION,
  SET_POINT_COLOR,
  SET_POINT_OPACITY,
  SET_BASE_LAYER,
  SET_BASE_LAYER_OPACITY,
  SET_UNITS_ONE,
  SET_UNITS_OTHER,
  SET_FLYOUT_TITLE,
  SET_CENTER_AND_ZOOM
} from '../../actions';

export default function featureMap(state, action) {
  if (_.isUndefined(state)) {
    return vifs().featureMap;
  }

  state = _.cloneDeep(state);

  switch (action.type) {
    case RECEIVE_METADATA:
      forEachSeries(state, series => {
        let rowDisplayUnit = _.get(action, 'phidippidesMetadata.rowDisplayUnit', translate('visualizations.common.unit.one'));
        let unitOne = _.get(series, 'unit.one', null);
        let unitOther = _.get(series, 'unit.other', null);

        if (unitOne === null) {
          setValueOrDefaultValue(series, 'unit.one', rowDisplayUnit);
        }

        if (unitOther === null) {
          setValueOrDefaultValue(series, 'unit.other', utils.pluralize(rowDisplayUnit));
        }
      });
      break;

    case SET_DIMENSION:
      _.unset(state, 'configuration.mapCenterAndZoom');

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
        setValueOrDefaultValue(series, 'unit.one', action.one, translate('visualizations.common.unit.one'));
      });
      break;

    case SET_UNITS_OTHER:
      forEachSeries(state, series => {
        setValueOrDefaultValue(series, 'unit.other', action.other, translate('visualizations.common.unit.other'));
      });
      break;

    case SET_FLYOUT_TITLE:
      _.set(state, 'configuration.flyoutTitleColumnName', action.flyoutTitleColumnName);
      break;

    case SET_CENTER_AND_ZOOM:
      _.set(state, 'configuration.mapCenterAndZoom', action.centerAndZoom);
      break;
  }

  return state;
}
