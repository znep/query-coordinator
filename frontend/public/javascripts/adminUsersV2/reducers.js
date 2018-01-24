import { combineReducers } from 'redux';
import autocomplete from 'common/autocomplete/reducers/StatefulAutocompleteReducer';
import roles from './roles/reducers';
import users from './users/reducers';
import invitedUsers from './invitedUsers/reducers';
import ui from './ui/reducers';
import teams from './teams/reducers';

const config = (state = {}) => state;

export default combineReducers({
  ui,
  users,
  invitedUsers,
  roles,
  config,
  teams,
  autocomplete
});
