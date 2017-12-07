import { COMPLETE_SUCCESS, LOAD_DATA } from '../actions';
import { SUBMIT_NEW_USERS } from '../users/actions';
import { REMOVE_INVITED_USER } from './actions';

import _ from 'lodash';
const invitedUsers = (state = [], action) => {
  switch (action.type) {
    case LOAD_DATA:
      if (action.stage === COMPLETE_SUCCESS) {
        return action.invitedUsers;
      }
      return state;
    case REMOVE_INVITED_USER:
      if (action.stage === COMPLETE_SUCCESS) {
        return state.filter(user => user.id !== _.get(action, 'payload.id', null));
      }
      return state;
    case SUBMIT_NEW_USERS:
      if (action.stage === COMPLETE_SUCCESS) {
        return _.get(action, 'payload.invitedUsers', []).concat(state);
      }
      return state;
    default:
      return state;
  }
};

export default invitedUsers;
