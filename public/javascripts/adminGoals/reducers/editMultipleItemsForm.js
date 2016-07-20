import Immutable from 'immutable';
import { createReducer } from 'redux-immutablejs';

import {
  OPEN_EDIT_MULTIPLE_ITEMS_MODAL,
  CLOSE_EDIT_MULTIPLE_ITEMS_MODAL,
  SET_MULTIPLE_ITEMS_VISIBILITY,
  REVERT_MULTIPLE_ITEMS_VISIBILITY,
  UPDATE_MULTIPLE_ITEMS_STARTED,
  UPDATE_MULTIPLE_ITEMS_SUCCESS,
  UPDATE_MULTIPLE_ITEMS_FAILED
} from '../actionTypes';

const openEditMultipleItemsModal = (state, action) => state.merge({ visible: true });

const closeEditMultipleItemsModal = (state, action) => state.merge({ visible: false, goal: {  } });

const setMultipleItemsVisibility = (state, action) => state.merge({ goal: { is_public: action.visibility } });

const revertMultipleItemsVisibility = (state, action) => state.removeIn(['goal', 'is_public']);

const startUpdatingMultipleItems = (state, action) => state.merge({ updateInProgress: true, showFailureMessage: false });

const updatingMultipleItemsSucceeded = (state, action) => state.merge({ updateInProgress: false, visible: false, goal: {} });

const updatingMultipleItemsFailed = (state, action) => state.merge({ updateInProgress: false, showFailureMessage: true });

export default createReducer(Immutable.fromJS({}), {
  [OPEN_EDIT_MULTIPLE_ITEMS_MODAL]: openEditMultipleItemsModal,
  [CLOSE_EDIT_MULTIPLE_ITEMS_MODAL]: closeEditMultipleItemsModal,
  [SET_MULTIPLE_ITEMS_VISIBILITY]: setMultipleItemsVisibility,
  [REVERT_MULTIPLE_ITEMS_VISIBILITY]: revertMultipleItemsVisibility,
  [UPDATE_MULTIPLE_ITEMS_STARTED]: startUpdatingMultipleItems,
  [UPDATE_MULTIPLE_ITEMS_SUCCESS]: updatingMultipleItemsSucceeded,
  [UPDATE_MULTIPLE_ITEMS_FAILED]: updatingMultipleItemsFailed
});
