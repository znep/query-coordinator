import _ from 'lodash';

import SoqlDataProvider from 'common/visualizations/dataProviders/SoqlDataProvider';
import { TRAILING_UID_REGEX } from 'common/constants';

export const SET_DATA_SOURCE_UID = 'SET_DATA_SOURCE_UID';
export const setDataSourceUid = (uid) => ({
  type: SET_DATA_SOURCE_UID,
  uid
});

export const RECEIVE_DATA_SOURCE_ROW_COUNT = 'RECEIVE_DATA_SOURCE_ROW_COUNT';
export const receiveDataSourceRowCount = (rowCount) => ({
  type: RECEIVE_DATA_SOURCE_ROW_COUNT,
  rowCount
});

export const setDataSource = (dataSourceString) => {
  return (dispatch) => {
    const uid = _.get(dataSourceString.match(TRAILING_UID_REGEX), '1');
    dispatch(setDataSourceUid(uid));

    if (!uid) {
      return;
    }

    const soqlDataProvider = new SoqlDataProvider({
      domain: window.location.hostname,
      datasetUid: uid
    });

    soqlDataProvider.getRowCount().then(
      (rowCount) => {
        dispatch(receiveDataSourceRowCount(rowCount));
      }
    );
  };
};

export const SET_ANALYSIS = 'SET_ANALYSIS';
export const setAnalysis = (analysis) => ({
  type: SET_ANALYSIS,
  analysis
});

export const SET_CALCULATION_TYPE = 'SET_CALCULATION_TYPE';
export const setCalculationType = (calculationType) => ({
  type: SET_CALCULATION_TYPE,
  calculationType
});

export const TOGGLE_EXCLUDE_NULL_VALUES = 'TOGGLE_EXCLUDE_NULL_VALUES';
export const toggleExcludeNullValues = (excludeNullValues) => ({
  type: TOGGLE_EXCLUDE_NULL_VALUES,
  excludeNullValues
});

export const SET_DECIMAL_PLACES = 'SET_DECIMAL_PLACES';
export const setDecimalPlaces = (places) => ({
  type: SET_DECIMAL_PLACES,
  places
});

export const SET_UNIT_LABEL = 'SET_UNIT_LABEL';
export const setUnitLabel = (label) => ({
  type: SET_UNIT_LABEL,
  label
});

export const SET_METHODS = 'SET_METHODS';
export const setMethods = (methods) => ({
  type: SET_METHODS,
  methods
});

export const OPEN_EDIT_MODAL = 'OPEN_EDIT_MODAL';
export const openEditModal = () => (dispatch, getState) => {
  const measure = getState().view.measure;
  dispatch({
    type: OPEN_EDIT_MODAL,
    measure
  });
};

export const ACCEPT_EDIT_MODAL_CHANGES = 'ACCEPT_EDIT_MODAL_CHANGES';
export const acceptEditModalChanges = () => (dispatch, getState) => {
  const measure = getState().editor.measure;
  dispatch({
    type: ACCEPT_EDIT_MODAL_CHANGES,
    measure
  });
};

export const CANCEL_EDIT_MODAL = 'CANCEL_EDIT_MODAL';
export const cancelEditModal = () => ({
  type: CANCEL_EDIT_MODAL
});
