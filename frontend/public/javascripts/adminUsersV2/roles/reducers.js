import { COMPLETE_SUCCESS, LOAD_DATA } from '../actions';

const roles = (state = [], action) => {
  if (action.type === LOAD_DATA && action.stage === COMPLETE_SUCCESS) {
    return action.roles;
  } else {
    return state;
  }
};

export default roles;
