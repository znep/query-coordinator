import {
  START_LOADING,
  STOP_LOADING,
  SET_ACTIVITIES,
  SET_PAGINATION,
  SET_ALERT,
  DISMISS_ALERT,
  SHOW_RESTORE_MODAL,
  DISMISS_RESTORE_MODAL,
  SHOW_DETAILS_MODAL,
  DISMISS_DETAILS_MODAL,
  SET_FILTER_EVENT,
  SET_FILTER_STATUS,
  SET_FILTER_DATE
} from './actionTypes';

export const setActivities = (activities) => ({
  type: SET_ACTIVITIES,
  activities
});

export const setPagination = (pagination) => ({
  type: SET_PAGINATION,
  pagination
});

export const loadActivities = () => {
  return (getService) => (dispatch, getState) => {
    dispatch(startLoading());

    const api = getService('api');
    const state = getState();
    const currentPage = state.getIn(['pagination', 'currentPage']);
    const activityType = state.getIn(['filtering', 'eventType']);
    const activityStatus = state.getIn(['filtering', 'eventStatus']);
    const dateFrom = state.getIn(['filtering', 'dateFrom']);
    const dateTo = state.getIn(['filtering', 'dateTo']);

    return api.get(currentPage, activityType, activityStatus, dateFrom, dateTo).then(data => {
      const pagerInfo = data['pager_info'];

      dispatch(setActivities(data.activities));
      dispatch(setPagination({
        currentPage,
        hasNextPage: pagerInfo['has_next_page?'],
        hasPreviousPage: pagerInfo['has_prev_page?']
      }));
      dispatch(stopLoading());

      return data;
    }).catch((error) => { // eslint-disable-line dot-notation
      dispatch(setAlert('error', 'general_error', {error: error.message}));
      dispatch(stopLoading());
    });
  };
};

export const dismissAlert = () => ({
  type: DISMISS_ALERT
});

export const setAlert = (alertType, translationKey, data) => ({
  type: SET_ALERT,
  alertType,
  translationKey,
  data
});

export const showRestoreModal = (activity) => ({
  type: SHOW_RESTORE_MODAL,
  activity
});

export const dismissRestoreModal = () => ({
  type: DISMISS_RESTORE_MODAL
});

export const showDetailsModal = (activity) => ({
  type: SHOW_DETAILS_MODAL,
  activity
});

export const dismissDetailsModal = () => ({
  type: DISMISS_DETAILS_MODAL
});

export const restoreDataset = () => {
  return (getService) => (dispatch, getState) => {
    const state = getState();
    const api = getService('api');
    const datasetId = state.getIn(['restoreModal', 'id']);

    dispatch(startLoading());

    return api.
      restoreDataset(datasetId).
      then(() => {
        dispatch(setAlert('success', 'restore_success'));
        dispatch(dismissRestoreModal());
        return dispatch(loadActivities());
      }).
      catch((error) => { // eslint-disable-line dot-notation
        dispatch(dismissRestoreModal());
        dispatch(stopLoading());
        return dispatch(setAlert('error', 'general_error', { error: error.message }));
      });
  };
};

export const gotoPage = (pageNumber) => {
  return () => (dispatch, getState) => {
    const pagination = getState().get('pagination').toJS();
    pagination.currentPage = pageNumber;

    dispatch(setPagination(pagination));
    return dispatch(loadActivities());
  };
};

export const filterByEvent = (value) =>
  () => (dispatch, getState) => {
    const pagination = getState().get('pagination').toJS();
    pagination.currentPage = 1;
    dispatch(setPagination(pagination));
    dispatch(setFilterEvent(value));
    return dispatch(loadActivities());
  };

export const setFilterEvent = (value) => ({
  type: SET_FILTER_EVENT,
  value
});

export const filterByStatus = (value) => (
  () => (dispatch, getState) => {
    const pagination = getState().get('pagination').toJS();
    pagination.currentPage = 1;
    dispatch(setPagination(pagination));
    dispatch(setFilterStatus(value));
    return dispatch(loadActivities());
  }
);

export const setFilterStatus = (value) => ({
  type: SET_FILTER_STATUS,
  value
});

export const filterByDate = (value) => (
  () => (dispatch, getState) => {
    const pagination = getState().get('pagination').toJS();
    pagination.currentPage = 1;
    dispatch(setPagination(pagination));
    dispatch(setFilterDate(value));
    return dispatch(loadActivities());
  }
);

export const setFilterDate = (value) => ({
  type: SET_FILTER_DATE,
  value
});

export const startLoading = () => ({
  type: START_LOADING
});

export const stopLoading = () => ({
  type: STOP_LOADING
});
