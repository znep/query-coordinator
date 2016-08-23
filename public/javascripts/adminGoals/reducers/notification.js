import * as Immutable from 'immutable';
import * as ReduxImmutable from 'redux-immutablejs';
import * as Actions from '../actions/notificationActions';

const showNotification = (state, action) => state.merge({
  visible: true,
  type: action.notificationType,
  message: action.message
});

const dismissNotification = state => state.set('visible', false);

export default ReduxImmutable.createReducer(Immutable.fromJS({ visible: false, type: 'success', message: '' }), {
  [Actions.types.show]: showNotification,
  [Actions.types.hide]: dismissNotification
});
