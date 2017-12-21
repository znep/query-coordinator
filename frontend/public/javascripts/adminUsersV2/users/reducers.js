import { COMPLETE_FAIL, COMPLETE_SUCCESS, LOAD_DATA, START } from '../actions';
import { ROLE_FILTER_CHANGED, USER_ROLE_CHANGE } from '../roles/actions';
import { SORT_COLUMN, GOTO_PAGE, USER_SEARCH } from './actions';
import { SORT_KEYS } from 'common/users-api';

import get from 'lodash/get';
import { SORT_DIRECTION } from 'common/users-api';

const userRoleChange = (state, action) => {
  return state.map(user => {
    if (user.id !== action.userId) return user;
    switch (action.stage) {
      case START:
        return {
          ...user,
          pendingRole: action.newRole
        };
      case COMPLETE_FAIL:
        return {
          ...user,
          pendingRole: undefined
        };
      case COMPLETE_SUCCESS:
        return {
          ...user,
          pendingRole: undefined,
          roleId: action.newRole
        };
      default:
        console.warn(`Invalid stage ${action.stage} for action`, action);
        return user;
    }
  });
};

const updateColumnSort = (columnKey, state) => {
  const orderBy = getOrderBy(state);
  const sortDirection = getSortDirection(state);
  if (orderBy !== columnKey) {
    return { ...state, orderBy: columnKey, sortDirection: initialState.sortDirection };
  } else {
    return { ...state, sortDirection: SORT_DIRECTION[Object.values(SORT_DIRECTION).filter(val => val !== sortDirection)[0]] };
  }
};

const initialState = {
  loadingData: true,
  zeroBasedPage: 0,
  orderBy: SORT_KEYS.SCREEN_NAME,
  sortDirection: SORT_DIRECTION.ASC,
  resultCount: 0,
  users: []
};

const usersReducer = (state = initialState, action) => {
  switch (action.type) {
    case USER_ROLE_CHANGE:
      return { ...state, users: userRoleChange(state.users, action) };

    case LOAD_DATA:
      if (action.stage === COMPLETE_SUCCESS) {
        const { resultCount, users } = action.users;
        return { ...state, loadingData: false, resultCount, users };
      }
      return { ...state, loadingData: action.stage === START };

    case USER_SEARCH:
      if (action.stage === COMPLETE_SUCCESS) {
        const { resultCount, users } = action.payload;
        return { ...state, loadingData: false, resultCount, users };
      }
      return { ...state, loadingData: action.stage === START };

    case ROLE_FILTER_CHANGED:
      if (action.stage === COMPLETE_SUCCESS) {
        const { resultCount, users } = action.users;
        return { ...state, loadingData: false, resultCount, users };
      }
      return { ...state, loadingData: action.stage === START };

    case GOTO_PAGE:
      return {...state, zeroBasedPage: makeZeroBasedPageFromPager(action.payload.page) };

    case SORT_COLUMN:
      return updateColumnSort(action.payload.columnKey, state);

    default:
      return state;
  }
};

export default usersReducer;

export const makeZeroBasedPageFromPager = page => Math.max(0, page - 1);
export const getZeroBasedPage = state => get(state, 'zeroBasedPage');
export const getCurrentPage = state => getZeroBasedPage(state) + 1;
export const getResultCount = state => get(state, 'resultCount');
export const getUsers = state => get(state, 'users');
export const getOrderBy = state => get(state, 'orderBy');
export const getSortDirection = state => get(state, 'sortDirection');
export const getLoadingData = state => get(state, 'loadingData');
