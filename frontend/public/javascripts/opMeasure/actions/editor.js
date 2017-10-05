import _ from 'lodash';

import { SoqlDataProvider, MetadataProvider } from 'common/visualizations/dataProviders';
import { TRAILING_UID_REGEX } from 'common/constants';

export const SET_DATA_SOURCE_UID = 'SET_DATA_SOURCE_UID';
export const setDataSourceUid = (uid) => ({
  type: SET_DATA_SOURCE_UID,
  uid
});

export const RECEIVE_DATA_SOURCE_METADATA = 'RECEIVE_DATA_SOURCE_METADATA';
export const receiveDataSourceMetadata = (rowCount, dataSourceViewMetadata, displayableFilterableColumns) => (
  {
    type: RECEIVE_DATA_SOURCE_METADATA,
    rowCount,
    dataSourceViewMetadata,
    displayableFilterableColumns
  }
);

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

    const metadataProvider = new MetadataProvider({
      domain: window.location.hostname,
      datasetUid: uid
    });

    const metadataPromise = metadataProvider.getDatasetMetadata();
    const rowCountPromise = soqlDataProvider.getRowCount();

    return Promise.all([
      metadataPromise,
      rowCountPromise
    ]).then(([dataSourceViewMetadata, rowCount]) => {
      return metadataProvider.getDisplayableFilterableColumns(dataSourceViewMetadata).
        then((displayableFilterableColumns) => {
          dispatch(
            receiveDataSourceMetadata(rowCount, dataSourceViewMetadata, displayableFilterableColumns));
        });
    });
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

export const SET_COLUMN = 'SET_COLUMN';
export const setColumn = (fieldName) => ({
  type: SET_COLUMN,
  fieldName
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

