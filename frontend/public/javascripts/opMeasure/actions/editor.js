import _ from 'lodash';

import { SoqlDataProvider, MetadataProvider } from 'common/visualizations/dataProviders';
import { TRAILING_UID_REGEX } from 'common/http/constants';

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
  return async (dispatch) => {
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

    dispatch(
      receiveDataSourceMetadata(
        await soqlDataProvider.getRowCount(),
        await metadataPromise,
        await metadataProvider.getDisplayableFilterableColumns(await metadataPromise)
      )
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

export const SET_COLUMN = 'SET_COLUMN';
export const setColumn = (fieldName) => ({
  type: SET_COLUMN,
  fieldName
});

export const SET_VALUE_COLUMN = 'SET_VALUE_COLUMN';
export const setValueColumn = (fieldName) => ({
  type: SET_VALUE_COLUMN,
  fieldName
});

export const SET_AGGREGATION_TYPE = 'SET_AGGREGATION_TYPE';
export const setAggregationType = (aggregationType) => ({
  type: SET_AGGREGATION_TYPE,
  aggregationType
});


export const SET_NUMERATOR_COLUMN = 'SET_NUMERATOR_COLUMN';
export const setNumeratorColumn = (fieldName) => ({
  type: SET_NUMERATOR_COLUMN,
  fieldName
});

export const SET_NUMERATOR_COLUMN_CONDITION = 'SET_NUMERATOR_COLUMN_CONDITION';
export const setNumeratorColumnCondition = (condition) => ({
  type: SET_NUMERATOR_COLUMN_CONDITION,
  condition
});

export const SET_DENOMINATOR_COLUMN = 'SET_DENOMINATOR_COLUMN';
export const setDenominatorColumn = (fieldName) => ({
  type: SET_DENOMINATOR_COLUMN,
  fieldName
});

export const SET_FIXED_DENOMINATOR = 'SET_FIXED_DENOMINATOR';
export const setFixedDenominator = (denominator) => ({
  type: SET_FIXED_DENOMINATOR,
  denominator
});

export const SET_DATE_COLUMN = 'SET_DATE_COLUMN';
export const setDateColumn = (fieldName) => ({
  type: SET_DATE_COLUMN,
  fieldName
});

export const TOGGLE_INCLUDE_NULL_VALUES = 'TOGGLE_INCLUDE_NULL_VALUES';
export const toggleIncludeNullValues = (includeNullValues) => ({
  type: TOGGLE_INCLUDE_NULL_VALUES,
  includeNullValues
});

export const TOGGLE_DENOMINATOR_INCLUDE_NULL_VALUES = 'TOGGLE_DENOMINATOR_INCLUDE_NULL_VALUES';
export const toggleDenominatorIncludeNullValues = (includeNullValues) => ({
  type: TOGGLE_DENOMINATOR_INCLUDE_NULL_VALUES,
  includeNullValues
});

export const SET_DECIMAL_PLACES = 'SET_DECIMAL_PLACES';
export const setDecimalPlaces = (places) => ({
  type: SET_DECIMAL_PLACES,
  places
});

export const TOGGLE_DISPLAY_AS_PERCENT = 'TOGGLE_DISPLAY_AS_PERCENT';
export const toggleDisplayAsPercent = () => ({
  type: TOGGLE_DISPLAY_AS_PERCENT
});

export const SET_UNIT_LABEL = 'SET_UNIT_LABEL';
export const setUnitLabel = (label) => ({
  type: SET_UNIT_LABEL,
  label
});

export const SET_START_DATE = 'SET_START_DATE';
export const setStartDate = (startDate) => ({
  type: SET_START_DATE,
  startDate
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

