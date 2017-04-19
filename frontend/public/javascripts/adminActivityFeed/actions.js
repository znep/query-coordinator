export const types = {
  setActivities: 'SET_ACTIVITIES',
  setPagination: 'SET_PAGINATION',
  dismissError: 'DISMISS_ERROR',
  showDetailsModal: 'SHOW_DETAILS_MODAL',
  dismissDetailsModal: 'DISMISS_DETAILS_MODAL'
};

export const setActivities = (activities) => ({
  type: types.setActivities,
  activities
});

export const setPagination = (pagination) => ({
  type: types.setPagination,
  pagination
});

export const loadActivities = () => {
  return (getService) => (dispatch) => {
    const api = getService('api');

    // TODO: apply filtering and pagination
    return api.get().then(data => {
      dispatch(setActivities(data.activities));
      dispatch(setPagination(data.pager_info));

      return data;
    });
  };
};

export const dismissError = () => ({
  type: types.dismissError
});

export const showDetailsModal = (activity) => ({
  type: types.showDetailsModal,
  activity
});

export const dismissDetailsModal = () => ({
  type: types.dismissDetailsModal
});
