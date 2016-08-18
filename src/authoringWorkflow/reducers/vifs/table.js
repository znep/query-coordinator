import _ from 'lodash';
import utils from 'socrata-utils';

import { translate } from '../../../I18n';
import vifs from '../../vifs';

import { getDisplayableColumns } from '../../selectors/metadata';
import {
  forEachSeries,
  setStringValueOrDefaultValue,
  setUnits,
} from '../../helpers';
import {
  RECEIVE_METADATA,
  SET_DOMAIN,
  SET_DATASET_UID,
  SET_UNIT_ONE,
  SET_UNIT_OTHER
} from '../../actions';

export default function table(state, action) {
  if (_.isUndefined(state)) {
    return vifs().table;
  }

  state = _.cloneDeep(state);

  switch (action.type) {
    case RECEIVE_METADATA:
      let metadata = {
        datasetUid: '',
        domain: '',
        data: action.datasetMetadata
      };
      let displayableColumns = getDisplayableColumns(metadata);

      if (displayableColumns.length > 0) {

        setStringValueOrDefaultValue(
          state,
          'configuration.order[0].columnName',
          displayableColumns[0].fieldName
        );
      }

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
  }

  return state;
}
