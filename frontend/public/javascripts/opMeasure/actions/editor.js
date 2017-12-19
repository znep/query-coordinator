import _ from 'lodash';

import { SoqlDataProvider, MetadataProvider } from 'common/visualizations/dataProviders';
import { TRAILING_UID_REGEX } from 'common/http/constants';

import { validateAll } from './validate';

export const SET_DATA_SOURCE_UID = 'SET_DATA_SOURCE_UID';
export const setDataSourceUid = (uid) => ({
  type: SET_DATA_SOURCE_UID,
  uid
});

export const RECEIVE_DATA_SOURCE_VIEW = 'RECEIVE_DATA_SOURCE_VIEW';
export const receiveDataSourceMetadata = (rowCount, dataSourceView, displayableFilterableColumns) => (
  {
    type: RECEIVE_DATA_SOURCE_VIEW,
    rowCount,
    dataSourceView,
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

    let metadata = null;
    let columns = [];
    let rowCount = -1;
    try {
      const metadataPromise = metadataProvider.getDatasetMetadata();
      [metadata, columns, rowCount] = await Promise.all([
        metadataPromise,
        metadataProvider.getDisplayableFilterableColumns(metadataPromise),
        soqlDataProvider.getRowCount()
      ]);
    } catch (ex) {
      console.error(ex);

      metadata = null;
      columns = [];
      rowCount = -1;
    }

    dispatch(
      receiveDataSourceMetadata(
        rowCount,
        metadata,
        columns
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

export const SET_PERIOD_TYPE = 'SET_PERIOD_TYPE';
export const setPeriodType = (periodType) => ({
  type: SET_PERIOD_TYPE,
  periodType
});

export const SET_PERIOD_SIZE = 'SET_PERIOD_SIZE';
export const setPeriodSize = (periodSize) => ({
  type: SET_PERIOD_SIZE,
  periodSize
});

export const SET_METHODS = 'SET_METHODS';
export const setMethods = (methods) => ({
  type: SET_METHODS,
  methods
});

export const SET_DESCRIPTION = 'SET_DESCRIPTION';
export const setDescription = (description) => ({
  type: SET_DESCRIPTION,
  description
});

export const SET_NAME = 'SET_NAME';
export const setName = (name) => ({
  type: SET_NAME,
  name
});

export const SET_SHORT_NAME = 'SET_SHORT_NAME';
export const setShortName = (shortName) => ({
  type: SET_SHORT_NAME,
  shortName
});

export const OPEN_EDIT_MODAL = 'OPEN_EDIT_MODAL';
export const openEditModal = () => (dispatch, getState) => {
  const { measure, coreView } = getState().view;
  dispatch({
    type: OPEN_EDIT_MODAL,
    coreView,
    measure
  });

  // Restore non-persisted data source info (name, row count, columns)
  dispatch(setDataSource(_.get(measure, 'dataSourceLensUid', '')));
};

export const ACCEPT_EDIT_MODAL_CHANGES = 'ACCEPT_EDIT_MODAL_CHANGES';
export const acceptEditModalChanges = () => (dispatch, getState) => {
  dispatch(validateAll());

  const { coreView, measure, validationErrors } = getState().editor;
  const hasErrors = _.some(_.values(validationErrors));

  if (!hasErrors) {
    dispatch({
      type: ACCEPT_EDIT_MODAL_CHANGES,
      coreView,
      measure
    });
  }
};

export const CANCEL_EDIT_MODAL = 'CANCEL_EDIT_MODAL';
export const cancelEditModal = () => ({
  type: CANCEL_EDIT_MODAL
});
