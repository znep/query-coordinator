import Immutable from 'immutable';
import { createReducer } from 'redux-immutablejs';
import {
  FETCH_CSV_EXPORT_STARTED,
  FETCH_CSV_EXPORT_SUCCEEDED,
  FETCH_CSV_EXPORT_FAILED,
  FETCH_CSV_EXPORT_CANCELED
} from '../actionTypes';

export const initialState = Immutable.fromJS({
  csv: {
    inProgress: false,
    failed: false
  }
});

const startCsvExport = state => state.setIn(['csv', 'inProgress'], true);
const failCsvExport = state => state.merge({ csv: { inProgress: false, failed: true } });
const resetCsv = state => state.set('csv', initialState.get('csv'));


export default createReducer(initialState, {
  [FETCH_CSV_EXPORT_STARTED]: startCsvExport,
  [FETCH_CSV_EXPORT_FAILED]: failCsvExport,
  [FETCH_CSV_EXPORT_SUCCEEDED]: resetCsv,
  [FETCH_CSV_EXPORT_CANCELED]: resetCsv
});
