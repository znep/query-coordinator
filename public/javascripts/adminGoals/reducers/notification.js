import Immutable from 'immutable';
import { createReducer } from 'redux-immutablejs';
import {
  SHOW_GLOBAL_NOTIFICATION,
  DISMISS_GLOBAL_NOTIFICATION
} from '../actionTypes';

const showNotification = (state, action) => state.merge({
  visible: true,
  type: action.notificationType,
  message: action.message
});

const dismissNotification = state => state.set('visible', false);

export default createReducer(Immutable.fromJS({ visible: false, type: 'success', message: '' }), {
  [SHOW_GLOBAL_NOTIFICATION]: showNotification,
  [DISMISS_GLOBAL_NOTIFICATION]: dismissNotification
});
