import * as api from '../lib/api';
import I18nJS from 'common/i18n';
import * as tableActions from './table';

const types = {
  CHANGE_DIMENSIONS: 'CHANGE_DIMENSIONS',
  TOGGLE_FILTERS: 'TOGGLE_FILTERS',
  STORE_NUMBER_OF_DAYS_RESTORABLE: 'STORE_NUMBER_OF_DAYS_RESTORABLE',
  SHOW_RESTORE_MODAL: 'SHOW_RESTORE_MODAL',
  HIDE_RESTORE_MODAL: 'HIDE_RESTORE_MODAL',
  API_CALL_IN_PROGRESS: 'API_CALL_IN_PROGRESS',
  API_CALL_SUCCESS: 'API_CALL_SUCCESS',
  API_ERROR: 'API_ERROR',
  SHOW_SUCCESS_MESSAGE: 'SHOW_SUCCESS_MESSAGE',
  HIDE_SUCCESS_MESSAGE: 'HIDE_SUCCESS_MESSAGE'
};

const changeDimensions = isMobile => ({ type: types.CHANGE_DIMENSIONS, isMobile });

const apiException = (errMsg = null) => ({ type: types.API_ERROR, details: errMsg });

const apiCallInProgress = () => ({ type: types.API_CALL_IN_PROGRESS });

const apiCallSuccess = () => ({ type: types.API_CALL_SUCCESS });

const toggleFilters = () => ({ type: types.TOGGLE_FILTERS });

const fetchNumberOfDaysRestorable = () => dispatch => api.fetchNumberOfDaysRestorable().
  then(numberOfDaysRestorable => {
    dispatch({
      type: types.STORE_NUMBER_OF_DAYS_RESTORABLE,
      numberOfDaysRestorable
    });
  });

const showRestoreModal = uid => ({ type: types.SHOW_RESTORE_MODAL, uid });

const hideRestoreModal = () => ({ type: types.HIDE_RESTORE_MODAL });

const hideSuccessMessage = () => ({ type: types.HIDE_SUCCESS_MESSAGE });

const showSuccessMessage = message => dispatch => {
  setTimeout(() => dispatch(hideSuccessMessage()), 2000);
  dispatch({ type: types.SHOW_SUCCESS_MESSAGE, message });
};

const restoreDataset = uid => dispatch => {
  dispatch(apiCallInProgress());
  dispatch(hideRestoreModal());

  api.restoreDataset(uid).
    then(() => {
      dispatch(showSuccessMessage(I18nJS.t('screens.admin.activity_feed.restore_success')));
      dispatch(tableActions.fetchData());
    }).
    catch((error) => {
      dispatch(hideRestoreModal());
      dispatch(apiException(error));
    });
};

export {
  types,
  apiException,
  apiCallInProgress,
  apiCallSuccess,
  changeDimensions,
  toggleFilters,
  fetchNumberOfDaysRestorable,
  showRestoreModal,
  hideRestoreModal,
  restoreDataset,
  showSuccessMessage,
  hideSuccessMessage
};
