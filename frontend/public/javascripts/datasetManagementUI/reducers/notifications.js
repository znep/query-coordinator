import _ from 'lodash';
import {
  ADD_NOTIFICATION,
  REMOVE_NOTIFICATION
} from '../actions/notifications';

export default function update(state = [], action) {
  switch (action.type) {
    case ADD_NOTIFICATION:
      return [
        ...state,
        action.notification
      ];

    case REMOVE_NOTIFICATION:
      return state.filter((notification) => !_.isEqual(action.notification, notification));

    default:
      return state;
  }
}
