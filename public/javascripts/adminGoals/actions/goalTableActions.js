import 'whatwg-fetch';
import _ from 'lodash';
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

    return getDashboards().
      then(getGoals).
      then(mergeDashboards).
      then(dispatchTotalGoalCount).
      then(sortGoals).
      then(trimToPageSize).
      then(getGoalsExtras).
      then(prepareGoals).
      catch(reason => dispatch(tableLoadPageFailed(reason)));// eslint-disable-line dot-notation

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

    function getGoals(dashboards) {
      let dashboardDetailFetchBatch = _.map(dashboards, getDashboardDetail);

      return Promise.all(dashboardDetailFetchBatch);
    }

    function mergeDashboards(goalResponses) {
      return _(goalResponses).
        map('categories').
        flatten().
        map(category => _.map(category.goals, (goal) =>
          _.assign(goal, {
            category: _.omit(category, 'goals'),
            dashboardName: _.find(goalResponses, { id: goal.base_dashboard }).name
          }))).
        reject(_.isEmpty).
        flatten().
        value();
    }

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
          sortedArray = _.orderBy(goals, 'updated_at', sortDirection);
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

    function dispatchTotalGoalCount(goals) {
      dispatch(setTotalGoalCount(goals.length));

      return goals;
    }

    function trimToPageSize(goals) {
      let index = state.getIn(['goalTableData', 'currentPage']) - 1;
      let sliceStart = index * state.getIn(['goalTableData', 'rowsPerPage']);
      let sliceEnd = index * state.getIn(['goalTableData', 'rowsPerPage']) +
        state.getIn(['goalTableData', 'rowsPerPage']);

      return _.slice(goals, sliceStart, sliceEnd);
    }

    function getGoalsExtras(goals) {
      let cachedUsers = _.get(state, 'cachedUsers', {});

      return Promise.all([
        getOwnerDetails(),
        getGoalDetails(),
        Promise.resolve(goals)
      ]);

      function getOwnerDetails() {
        let goalOwnerDetailPromises = _(goals).uniqBy('created_by').map(goal =>
          _.get(cachedUsers, goal.created_by) ?
            Promise.resolve(cachedUsers[goal.created_by]) :
            fetch(`/api/users/${goal.created_by}.json`, fetchOptions).
              then(checkXhrStatus).
              then(response => response.json())
        ).value();

        return Promise.all(goalOwnerDetailPromises);
      }

      function getGoalDetails() {
        let goalDetailPromises = _.map(goals, goal => state.hasIn(['goalTableData', 'cachedGoals', goal.id]) ?
          Promise.resolve(state.getIn(['goalTableData', 'cachedGoals', goal.id]).toJS()) :
          fetch(`/stat/api/v1/goals/${goal.id}`, fetchOptions).then(response => response.json()));

        return Promise.all(goalDetailPromises);
      }
    }

    function prepareGoals(responses) {
      let goalOwnerDetailResponses = responses[0];
      let goalDetailResponses = responses[1];
      let goals = responses[2];
      let cachedUsers = _.get(state, 'cachedUsers', {});

      let users = _.merge(
        cachedUsers,
        _.zipObject(_.map(goalOwnerDetailResponses, 'id'), goalOwnerDetailResponses)
      );
      dispatch(cacheUsers(users));

      let goalDetailSuccessfulResponses = _.reject(goalDetailResponses, { error: true });
      let goalDetails = _.zipObject(_.map(goalDetailSuccessfulResponses, 'id'), goalDetailSuccessfulResponses);

      let goalsWithExtras = _.map(goals, goal => {
        goal.created_by = users[goal.created_by];
        goal.prevailingMeasureProgress = _.get(goalDetails,
          `${goal.id}.prevailing_measure.computed_values.progress.progress`,
          _.get(goalDetails, `${goal.id}.prevailingMeasureProgress`));
        goal.datasetId = _.get(goalDetails, `${goal.id}.prevailing_measure.metric.dataset`);

        return goal;
      });

      let goalsCache = _.zipObject(_.map(goalsWithExtras, 'id'), goalsWithExtras);

      dispatch(cacheGoals(goalsCache));
      dispatch(tableShowPage(goalsWithExtras));
    }

    function getDashboardDetail(dashboard) {
      return fetch(`/stat/api/v1/dashboards/${dashboard.id}`, fetchOptions).
        then(checkXhrStatus).
        then(response => response.json()).
        catch(reason => dispatch(tableLoadPageFailed(reason))); // eslint-disable-line dot-notation
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
