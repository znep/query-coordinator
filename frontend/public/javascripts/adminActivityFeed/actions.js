import {
  SET_ACTIVITIES,
  SET_PAGINATION,
  DISMISS_ERROR,
  SHOW_RESTORE_MODAL,
  DISMISS_RESTORE_MODAL,
  SHOW_DETAILS_MODAL,
  DISMISS_DETAILS_MODAL
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
    const api = getService('api');
    const currentPage = getState().getIn(['pagination', 'currentPage']);

    return api.get(currentPage).then(data => {
      const pagerInfo = data['pager_info'];

      dispatch(setActivities(data.activities));
      dispatch(setPagination({
        currentPage,
        hasNextPage: pagerInfo['has_next_page?'],
        hasPreviousPage: pagerInfo['has_prev_page?']
      }));

      return data;
    });
  };
};

export const dismissError = () => ({
  type: DISMISS_ERROR
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

    return api.restoreDataset(datasetId).then(() => {
      dispatch(dismissRestoreModal());
      return dispatch(loadActivities());
    }).catch((error) => { // eslint-disable-line dot-notation
      if (window.error) {
        console.error(error);
      }
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
