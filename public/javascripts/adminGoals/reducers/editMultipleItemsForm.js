import Immutable from 'immutable';
import { createReducer } from 'redux-immutablejs';

import {
  OPEN_EDIT_MULTIPLE_ITEMS_MODAL,
  CLOSE_EDIT_MULTIPLE_ITEMS_MODAL,
  UPDATE_MULTIPLE_ITEMS_FORM_DATA,
  UPDATE_MULTIPLE_ITEMS_STARTED,
  UPDATE_MULTIPLE_ITEMS_SUCCESS,
  UPDATE_MULTIPLE_ITEMS_FAILED,
  UPDATE_MULTIPLE_ITEMS_NOT_CONFIGURED
} from '../actionTypes';

const openModal = state => state.merge({ visible: true });

const closeModal = state => state.merge({ visible: false, goal: {  }, showFailureMessage: false, showNotConfiguredMessage: false });

const updateFormData = (state, action) => state.merge({ goal: action.newData });

const startUpdate = state => state.merge({ updateInProgress: true, showFailureMessage: false });

const succeedUpdate = state => state.merge({ updateInProgress: false, visible: false, goal: {}, showFailureMessage: false });

const failUpdate = state => state.merge({ updateInProgress: false, showFailureMessage: true });

const notConfigured = state => state.merge({ updateInProgress: false, showFailureMessage: false, showNotConfiguredMessage: true });

export default createReducer(Immutable.fromJS({}), {
  [OPEN_EDIT_MULTIPLE_ITEMS_MODAL]: openModal,
  [CLOSE_EDIT_MULTIPLE_ITEMS_MODAL]: closeModal,
  [UPDATE_MULTIPLE_ITEMS_FORM_DATA]: updateFormData,
  [UPDATE_MULTIPLE_ITEMS_STARTED]: startUpdate,
  [UPDATE_MULTIPLE_ITEMS_SUCCESS]: succeedUpdate,
  [UPDATE_MULTIPLE_ITEMS_FAILED]: failUpdate,
  [UPDATE_MULTIPLE_ITEMS_NOT_CONFIGURED]: notConfigured
});
