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
  SET_PRIMARY_COLOR,
  SET_POINT_OPACITY,
  SET_BASE_LAYER,
  SET_BASE_LAYER_OPACITY,
  SET_UNIT_ONE,
  SET_UNIT_OTHER,
  SET_ROW_INSPECTOR_TITLE_COLUMN_NAME,
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

    case SET_PRIMARY_COLOR:
      _.set(state, 'series[0].color.primary', action.primaryColor);
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

    case SET_UNIT_ONE:
      forEachSeries(state, series => {
        setValueOrDefaultValue(series, 'unit.one', action.one, translate('visualizations.common.unit.one'));
      });
      break;

    case SET_UNIT_OTHER:
      forEachSeries(state, series => {
        setValueOrDefaultValue(series, 'unit.other', action.other, translate('visualizations.common.unit.other'));
      });
      break;

    case SET_ROW_INSPECTOR_TITLE_COLUMN_NAME:
      _.set(state, 'configuration.rowInspectorTitleColumnName', action.rowInspectorTitleColumnName);
      break;

    case SET_CENTER_AND_ZOOM:
      _.set(state, 'configuration.mapCenterAndZoom', action.centerAndZoom);
      break;
  }

  return state;
}
