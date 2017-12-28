import _ from 'lodash';
import moment from 'moment';
import * as api from '../lib/api';
import * as commonActions from './common';

const types = {
  FETCH_DATA: 'FETCH_DATA',
  STORE_DATA: 'STORE_DATA',
  SHOW_DETAILS: 'SHOW_DETAILS',
  HIDE_DETAILS: 'HIDE_DETAILS',
  STORE_RESTORABLE_STATUS: 'STORE_RESTORABLE_STATUS'
};

const storeData = (data) => ({
  type: types.STORE_DATA,
  data
});

const checkRestorableStatus = () => (dispatch, getState) => {
  const state = getState();

  const filterByStatus = (row) => {
    const correctActivityType = row.activity_type === 'AssetDeleted';
    const createdAt = moment(row.created_at);
    const now = moment();
    const correctDateRange = now.diff(createdAt, 'days') <= state.common.numberOfDaysRestorable;

    return correctActivityType && correctDateRange;
  };

  const parseDetails = (row) => (row.details = (row.details && JSON.parse(row.details)) || {}) && row;

  const checkDatasetStatus = (row) => api.
    checkDatasetRestorable(row.dataset_uid).
    then(restorable => Promise.resolve({
      uid: row.dataset_uid,
      restorable
    }));

  const isRestorable = (row) => row.details.restorable;

  const storeRestorableList = (list) => dispatch({
    type: types.STORE_RESTORABLE_STATUS,
    list
  });

  const transformResults = (list) => {
    const result = {};
    list.forEach((obj) => result[obj.uid] = obj.restorable);
    return result;
  };

  // I wanted to include uniqBy into lodash wrapper chain but;
  // Current lodash version () has a bug and preventing use of uniqBy in chain.
  const data = _.uniqBy(state.table.data, 'dataset_uid');

  const checkDatasetStatusQueries = _(data).
    filter(filterByStatus). // filter by activity type and date check
    map(parseDetails). // json parse row details
    filter(isRestorable). // check for restorable flag in details
    map(checkDatasetStatus). // create a api call for each dataset to know if they're really restorable
    values();

  Promise.
    all(checkDatasetStatusQueries). // execute api queries
    then(transformResults). // transform results to uid:bool pairs
    then(storeRestorableList); // dispatch it to redux store
};

const fetchData = () => (dispatch, getState) => {
  const state = getState();

  const options = {
    offset: (state.pagination.page - 1) * state.pagination.pageSize,
    limit: state.pagination.pageSize,
    filters: state.filters,
    order: state.order
  };

  dispatch(commonActions.apiCallInProgress());

  return api.
    fetchTable(options).
    then((data) => dispatch(storeData(data))).
    then(() => dispatch(checkRestorableStatus())).
    then(() => dispatch(commonActions.apiCallSuccess())).
    catch((error) => dispatch(commonActions.apiException(error)));
};

const showDetails = (id) => ({
  type: types.SHOW_DETAILS,
  id
});

const hideDetails = () => ({
  type: types.HIDE_DETAILS
});

export {
  types,
  fetchData,
  storeData,
  showDetails,
  hideDetails
};
