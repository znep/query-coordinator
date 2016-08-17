import 'whatwg-fetch';
import _ from 'lodash';
import moment from 'moment';
import { fetchOptions } from '../constants';
import {
  TABLE_SHOW_PAGE,
  TABLE_LOAD_PAGE_FAILED,
  CACHE_DASHBOARDS,
  CACHE_USERS,
  CACHE_GOALS,
  CACHED_GOALS_UPDATED,
  TABLE_ROW_SELECTED,
  TABLE_ROW_DESELECTED,
  TABLE_ROW_ALL_SELECTION_TOGGLE,
  TABLE_ROW_MULTIPLE_SELECTION,
  ROWS_PER_PAGE_CHANGED,
  SET_TOTAL_GOAL_COUNT,
  SET_CURRENT_PAGE,
  SET_TABLE_ORDER
} from '../actionTypes';

function tableLoadPageFailed(reason) {
  return {
    type: TABLE_LOAD_PAGE_FAILED,
    reason,
    notification: {
      type: 'error',
      message: {
        path: 'admin.listing.default_alert_message'
      }
    }
  };
}

export function tableLoadPage() {
  return (dispatch, getState) => {
    let state = getState();

    return getDashboards().// Get dashboard list
      then(getGoals).// Get goals
      then(mergeDashboards).// Flatten goals
      then(getOwnerDetails).// Fetch owner info
      then(dispatchTotalGoalCount).// Dispatch total goal count
      then(sortGoals).// Sort goals
      then(trimToPageSize).// Apply pagination
      then(getGoalsExtras).// Get prevailing measure data
      then(dispatchToTable).// Show goals on table
      catch(reason => dispatch(tableLoadPageFailed(reason)));// eslint-disable-line dot-notation

    /**
     * Fetch dashboard list from API or from cache.
     * Dispatch dashboard list to cache.
     * @returns Array
     */
    function getDashboards() {
      const dashboardFetchUrl = '/stat/api/v1/dashboards';
      let cachedDashboards = state.getIn(['goalTableData', 'dashboards']);

      return cachedDashboards.isEmpty() ?
        fetch(dashboardFetchUrl, fetchOptions).
          then(checkXhrStatus).
          then(response => response.json()).
          then(response => {
            let dashboards = _.zipObject(_.map(response, 'id'), response);
            dispatch(cacheDashboards(dashboards));
            return dashboards;
          }) :
        Promise.resolve(state.getIn(['goalTableData', 'dashboards']).toJS());
    }

    /**
     * Fetch all dashboards details.
     * Category and goal lists come with dashboard details
     * @param dashboards
     * @returns Promise
     */
    function getGoals(dashboards) {
      const getDashboardDetail = dashboard =>
        fetch(`/stat/api/v1/dashboards/${dashboard.id}`, fetchOptions).
          then(checkXhrStatus).
          then(response => response.json()).
          catch(reason => dispatch(tableLoadPageFailed(reason))); // eslint-disable-line dot-notation

      const dashboardDetailFetchBatch = _.map(dashboards, getDashboardDetail);

      return Promise.all(dashboardDetailFetchBatch);
    }

    /**
     * Flatten dashboards as goal list
     * Assign category, dashboard name and update date timestamp to each goal
     * @param goalResponses
     * @returns Array
     */
    function mergeDashboards(goalResponses) {
      return _(goalResponses).
        map('categories').
        flatten().
        map(category => _.map(category.goals, (goal) =>
          _.assign(goal, {
            category: _.omit(category, 'goals'),
            dashboardName: _.find(goalResponses, { id: goal.base_dashboard }).name,
            updatedAtTimestamp: moment(goal.updated_at || goal.created_at).unix()
          }))).
        reject(_.isEmpty).
        flatten().
        value();
    }

    /**
     * Fetch & assign owner details for goals
     * Dispatch owner list to cache
     * @param goals
     * @returns Array goals
     */
    function getOwnerDetails(goals) {
      let cachedUsers = _.get(state, 'cachedUsers', {});

      const fetchUserFromApi = userId =>
        fetch(`/api/users/${userId}.json`, fetchOptions).
          then(checkXhrStatus).
          then(response => response.json());

      const getUser = userId => _.get(cachedUsers, userId) ?
        Promise.resolve(cachedUsers[userId]) : fetchUserFromApi(userId);

      const promises = _(goals).uniqBy('created_by').map(goal => getUser(goal.created_by)).value();

      return Promise.all(promises).then((goalOwnerDetailResponses) => {
        const users = _.merge(
          cachedUsers,
          _.zipObject(_.map(goalOwnerDetailResponses, 'id'), goalOwnerDetailResponses)
        );
        dispatch(cacheUsers(users));

        return _.map(goals, goal => _.assign(goal, {created_by: _.get(users, goal.created_by)}));
      });
    }

    /**
     * Sort goal list
     * By title, owner, update date, visibility, dashboard name
     * Sorting by goal status hasn't implemented yet.
     * @param goals
     * @returns Array goals
     */
    function sortGoals(goals) {
      let sortedArray;
      let sortColumn = state.getIn(['goalTableData', 'tableOrder', 'column']);
      let sortDirection = state.getIn(['goalTableData', 'tableOrder', 'direction']);

      switch (sortColumn) {
        case 'title':
          sortedArray = _.orderBy(goals, 'name', sortDirection);
          break;
        case 'owner':
          sortedArray = _.orderBy(goals, 'created_by.displayName', sortDirection);
          break;
        case 'updated_at':
          sortedArray = _.orderBy(goals, 'updatedAtTimestamp', sortDirection);
          break;
        case 'visibility':
          sortedArray = _.orderBy(goals, 'is_public', sortDirection);
          break;
        case 'dashboard':
          sortedArray = _.orderBy(goals, 'dashboardName', sortDirection);
          break;
        case 'goal_status':
        default:
          sortedArray = goals;
      }

      return sortedArray;
    }

    /**
     * Dispatch goal count to store
     * @param goals
     * @returns Array goals
     */
    function dispatchTotalGoalCount(goals) {
      dispatch(setTotalGoalCount(goals.length));

      return goals;
    }

    /**
     * Apply pagination to goal list
     * @param goals
     * @returns Array goals
     */
    function trimToPageSize(goals) {
      let index = state.getIn(['goalTableData', 'currentPage']) - 1;
      let sliceStart = index * state.getIn(['goalTableData', 'rowsPerPage']);
      let sliceEnd = index * state.getIn(['goalTableData', 'rowsPerPage']) +
        state.getIn(['goalTableData', 'rowsPerPage']);

      return _.slice(goals, sliceStart, sliceEnd);
    }

    /**
     * Fetch & assign prevailing measure data of goals
     * @param goals
     * @returns Array goals
     */
    function getGoalsExtras(goals) {
      const getGoalDetails = () => {
        let goalDetailPromises = _.map(goals, goal => state.hasIn(['goalTableData', 'cachedGoals', goal.id]) ?
          Promise.resolve(state.getIn(['goalTableData', 'cachedGoals', goal.id]).toJS()) :
          fetch(`/stat/api/v1/goals/${goal.id}`, fetchOptions).then(response => response.json()));

        return Promise.all(goalDetailPromises);
      };

      const rejectFailures = responses => _.reject(responses, { error: true });

      const createMap = responses => _.zipObject(_.map(responses, 'id'), responses);

      const assignExtras = extrasMap => {
        return _.map(goals, goal => {
          goal.prevailingMeasureProgress = _.get(extrasMap,
            `${goal.id}.prevailing_measure.computed_values.progress.progress`,
            _.get(extrasMap, `${goal.id}.prevailingMeasureProgress`));
          goal.datasetId = _.get(extrasMap, `${goal.id}.prevailing_measure.metric.dataset`);

          return goal;
        });
      };

      const dispatchToCache = goalsWithExtras => {
        let goalsCache = _.zipObject(_.map(goalsWithExtras, 'id'), goalsWithExtras);
        dispatch(cacheGoals(goalsCache));

        return goalsWithExtras;
      };

      return getGoalDetails().
        then(rejectFailures).
        then(createMap).
        then(assignExtras).
        then(dispatchToCache);
    }

    /**
     * Dispatch final list goals to be displayed on table
     * @param goalsWithExtras
     */
    function dispatchToTable(goalsWithExtras) {
      dispatch(tableShowPage(goalsWithExtras));
      dispatch(toggleAllRows(false));
    }
  };
}

export function tableShowPage(goals) {
  return {
    type: TABLE_SHOW_PAGE,
    goals
  };
}

export function cacheDashboards(dashboards) {
  return {
    type: CACHE_DASHBOARDS,
    dashboards
  };
}

export function cacheUsers(users) {
  return {
    type: CACHE_USERS,
    users
  };
}

export function cacheGoals(goals) {
  return {
    type: CACHE_GOALS,
    goals
  };
}

export function updateCachedGoals(goals) {
  return {
    type: CACHED_GOALS_UPDATED,
    goals
  };
}

function checkXhrStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }

  let error = new Error(response.statusText);
  error.response = response;
  throw error;
}

export function selectRow(goalId) {
  return {
    type: TABLE_ROW_SELECTED,
    goalId
  };
}

export function deselectRow(goalId) {
  return {
    type: TABLE_ROW_DESELECTED,
    goalId
  };
}

export function toggleAllRows(checked) {
  return {
    type: TABLE_ROW_ALL_SELECTION_TOGGLE,
    checked
  };
}

export function multipleRowSelection(goalId) {
  return {
    type: TABLE_ROW_MULTIPLE_SELECTION,
    goalId
  };
}

export function setRowsPerPage(value) {
  return dispatch => {
    dispatch({type: ROWS_PER_PAGE_CHANGED, value});
    dispatch(tableLoadPage());
  };
}

export function setTotalGoalCount(count) {
  return {
    type: SET_TOTAL_GOAL_COUNT,
    count
  };
}

export function setCurrentPage(page) {
  return dispatch => {
    dispatch({type: SET_CURRENT_PAGE, page});
    dispatch(tableLoadPage());
  };
}

export function sortRows(column, direction) {
  return dispatch => {
    dispatch({type: SET_TABLE_ORDER, column, direction});
    dispatch(tableLoadPage());
  };
}
