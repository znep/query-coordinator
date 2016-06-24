import 'whatwg-fetch';
import _ from 'lodash';

import {
  TABLE_SHOW_PAGE,
  CACHE_DASHBOARDS,
  CACHE_USERS,
  TABLE_ROW_SELECTED,
  TABLE_ROW_DESELECTED,
  TABLE_ROW_ALL_SELECTION_TOGGLE,
  ROWS_PER_PAGE_CHANGED,
  SET_TOTAL_GOAL_COUNT,
  SET_CURRENT_PAGE,
  SET_TABLE_ORDER
} from '../actionTypes';

import {
  displayAlert
} from './alertActions';

const fetchOptions = {credentials: 'same-origin'};

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
      catch(() => dispatch(displayAlert({ label: 'error' })));// eslint-disable-line dot-notation

    function getDashboards() {
      const dashboardFetchUrl = '/stat/api/v1/dashboards';
      let cachedDashboards = _.get(state, 'cachedDashboards', {});

      return _.isEmpty(cachedDashboards) ?
        fetch(dashboardFetchUrl, fetchOptions).then(checkXhrStatus).then(response => response.json()) :
        Promise.resolve(cachedDashboards);
    }

    function getGoals(dashboards) {
      dispatch(cacheDashboards(_.zipObject(_.map(dashboards, 'id'), dashboards)));

      let dashboardDetailFetchBatch = _.map(dashboards, getDashboardDetail);

      return Promise.all(dashboardDetailFetchBatch);
    }

    function mergeDashboards(goalResponses) {
      return _(goalResponses).
        map('categories').
        flatten().
        map(category => _.map(category.goals, (goal) =>
          _.assign(goal, {
            category: category.id,
            dashboardName: _.find(goalResponses, { id: goal.base_dashboard }).name
          }))).
        reject(_.isEmpty).
        flatten().
        value();
    }

    function sortGoals(goals) {
      let sortedArray;

      switch (state.getIn(['goalTableData', 'tableOrder', 'column'])) {
        case 'title':
          sortedArray = _.sortByOrder(goals, 'name', state.getIn(['goalTableData', 'tableOrder', 'direction']));
          break;
        case 'owner':
          sortedArray = _.sortByOrder(goals, 'created_by.displayName',
            state.getIn(['goalTableData', 'tableOrder', 'direction']));
          break;
        case 'updated_at':
          sortedArray = _.sortByOrder(goals, 'updated_at', state.getIn(['goalTableData', 'tableOrder', 'direction']));
          break;
        case 'visibility':
          sortedArray = _.sortByOrder(goals, 'is_public', state.getIn(['goalTableData', 'tableOrder', 'direction']));
          break;
        case 'dashboard':
          sortedArray = _.sortByOrder(goals, 'dashboardName', state.getIn(['goalTableData', 'tableOrder', 'direction']));
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
        let goalOwnerDetailPromises = _(goals).uniq('created_by').map(goal =>
          _.get(cachedUsers, goal.created_by) ?
            Promise.resolve(cachedUsers[goal.created_by]) :
            fetch(`/api/users/${goal.created_by}.json`, fetchOptions).
              then(checkXhrStatus).
              then(response => response.json())
        ).value();

        return Promise.all(goalOwnerDetailPromises);
      }

      function getGoalDetails() {
        let goalDetailPromises = _.map(goals, goal => fetch(`/stat/api/v1/goals/${goal.id}`, fetchOptions).
         then(response => response.json()));

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
        goal.prevailingMeasureProgress = _.get(goalDetails, `${goal.id}.prevailing_measure.computed_values.progress.progress`, '');
        return goal;
      });

      dispatch(tableShowPage(goalsWithExtras));
    }

    function getDashboardDetail(dashboard) {
      return fetch(`/stat/api/v1/dashboards/${dashboard.id}`, fetchOptions).
        then(checkXhrStatus).
        then(response => response.json()).
        catch(() => dispatch(displayAlert({ label: 'error' }))); // eslint-disable-line dot-notation
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

export function toggleAllRows() {
  return {
    type: TABLE_ROW_ALL_SELECTION_TOGGLE
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
