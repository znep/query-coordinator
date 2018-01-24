import * as Actions from './actions';
import get from 'lodash/fp/get';
import set from 'lodash/fp/set';

export const initialState = {
  loadingData: true,
  roles: [],
  userRoleFilter: undefined
};

const handleLoadRolesSuccess = (state, { roles }) => ({ ...state, loadingData: false, roles });
const handleLoadRolesFailure = set('loadingData', false);
const handleChangeUserRoleFilter = (state, { roleId }) => ({
  ...state,
  userRoleFilter: roleId === 'all' ? undefined : roleId
});

const reducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case Actions.LOAD_ROLES_SUCCESS:
      return handleLoadRolesSuccess(state, payload);
    case Actions.LOAD_ROLES_FAILURE:
      return handleLoadRolesFailure(state);
    case Actions.CHANGE_USER_ROLE_FILTER:
      return handleChangeUserRoleFilter(state, payload);
    default:
      return state;
  }
};

export const getRoles = get('roles');
export const getRolesLoading = get('loadingData');
export const getUserRoleFilter = get('userRoleFilter');

export default reducer;
