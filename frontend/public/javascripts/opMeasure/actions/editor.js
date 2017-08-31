import _ from 'lodash';

import SoqlDataProvider from 'common/visualizations/dataProviders/SoqlDataProvider';
import { TRAILING_UID_REGEX } from 'common/constants';

import { DataSourceStates } from '../lib/constants';
import { updateMeasure } from './view';

export const REQUEST_DATA_SOURCE = 'REQUEST_DATA_SOURCE';
export const requestDataSource = () => ({
  type: REQUEST_DATA_SOURCE
});

export const RECEIVE_DATA_SOURCE = 'RECEIVE_DATA_SOURCE';
export const receiveDataSource = (dataSource) => ({
  type: RECEIVE_DATA_SOURCE,
  dataSource
});

export const setDataSource = (dataSourceString) => {
  return (dispatch) => {
    const uid = _.get(dataSourceString.match(TRAILING_UID_REGEX), '1');
    if (!uid) {
      dispatch(receiveDataSource({
        status: null,
        uid
      }));
      return;
    }

    const soqlDataProvider = new SoqlDataProvider({
      domain: window.location.hostname,
      datasetUid: uid
    });

    dispatch(requestDataSource());

    soqlDataProvider.getRowCount().then(
      (rowCount) => {
        dispatch(receiveDataSource({
          status: rowCount === 0 ? DataSourceStates.NO_ROWS : DataSourceStates.VALID,
          uid
        }));
      },
      () => {
        dispatch(receiveDataSource({
          status: DataSourceStates.INVALID,
          uid
        }));
      }
    );
  };
};

export const SET_ANALYSIS = 'SET_ANALYSIS';
export const setAnalysis = (analysis) => ({
  type: SET_ANALYSIS,
  analysis
});

export const SET_METHODS = 'SET_METHODS';
export const setMethods = (methods) => ({
  type: SET_METHODS,
  methods
});

export const CLONE_MEASURE = 'CLONE_MEASURE';
export const cloneMeasure = (measure) => ({
  type: CLONE_MEASURE,
  measure
});

export const OPEN_EDIT_MODAL = 'OPEN_EDIT_MODAL';
export const openEditModal = () => ({
  type: OPEN_EDIT_MODAL
});

export const CLOSE_EDIT_MODAL = 'CLOSE_EDIT_MODAL';
export const closeEditModal = () => ({
  type: CLOSE_EDIT_MODAL
});

// Clone the view's measure into the editor's state, then open the edit modal.
export const launchEditModal = () => {
  return (dispatch, getState) => {
    dispatch(cloneMeasure(getState().view.measure));
    dispatch(openEditModal());
  };
};

// Clone the editor's measure into the view's state, then close the edit modal.
export const completeEditModal = () => {
  return (dispatch, getState) => {
    dispatch(updateMeasure(getState().editor.measure));
    dispatch(closeEditModal());
  };
};
