import 'whatwg-fetch';
import _ from 'lodash';

import {
  TABLE_SHOW_PAGE,
  TABLE_ERROR,
  CACHE_DASHBOARDS,
  CACHE_USERS
} from '../actionTypes';

const fetchOptions = {credentials: 'same-origin'};

export function tableLoadPage() {
  return (dispatch, getState) => {
    let state = getState();

    return getDashboards().
      then(getGoals).
      then(getGoalsExtras).
      then(prepareGoals).
      catch(error => dispatch(handleTableError(error)));

    function getDashboards() {
      const dashboardFetchUrl = '/stat/api/v1/dashboards';
      let cachedDashboards = _.get(state, 'cachedDashboards', {});

      return _.isEmpty(cachedDashboards) ?
        fetch(dashboardFetchUrl, fetchOptions).then(checkXhrStatus).then(response => response.json()) :
        new Promise(() => cachedDashboards);
    }

    function getGoals(dashboards) {
      dispatch(cacheDashboards(_.zipObject(_.map(dashboards, 'id'), dashboards)));

      let dashboardDetailFetchBatch = _.map(dashboards, getDashboardDetail);

      return Promise.all(dashboardDetailFetchBatch);
    }

    function getGoalsExtras(goalResponses) {
      let goals = _(goalResponses).
        map('categories').
        flatten().
        map('goals').
        reject(_.isEmpty).
        flatten().
        value();

      let cachedUsers = _.get(state, 'cachedUsers', {});

      return Promise.all([
        getOwnerDetails(),
        getGoalDetails()
      ]).catch(error => dispatch(handleTableError(error)));

      function getOwnerDetails() {
        let goalOwnerDetailPromises = _(goals).uniq('created_by').map(goal =>
          _.get(cachedUsers, goal.created_by) ?
            new Promise(resolve => resolve(cachedUsers[goal.created_by])) :
            fetch(`/api/users/${goal.created_by}.json`, fetchOptions).
              then(checkXhrStatus).
              then(response => response.json())
        ).value();

        return Promise.all(goalOwnerDetailPromises);
      }

      function getGoalDetails() {
        let goalDetailPromises = _.map(goals, goal => fetch(`/stat/api/v1/goals/${goal.id}`).
         then(response => response.json()));

        return Promise.all(goalDetailPromises);
      }
    }

    function prepareGoals(responses) {
      let goalOwnerDetailResponses = responses[0];
      let goalDetailResponses = responses[1];
      let cachedUsers = _.get(state, 'cachedUsers', {});

      let users = _.merge(
        cachedUsers,
        _.zipObject(_.map(goalOwnerDetailResponses, 'id'), goalOwnerDetailResponses)
      );
      dispatch(cacheUsers(users));

      let goalDetailSuccessfulResponses = _.reject(goalDetailResponses, { error: true });
      let goalDetails = _.zipObject(_.map(goalDetailSuccessfulResponses, 'id'), goalDetailSuccessfulResponses);

      let goals = _.map(goalDetails, goal => {
        goal.owner = users[goal.created_by];
        goal.status = _.get(goal, 'prevailing_measure.computed_values.progress.progress', '');
        return goal;
      });

      dispatch(tableShowPage(goals));
    }

    function getDashboardDetail(dashboard) {
      return fetch(`/stat/api/v1/dashboards/${dashboard.id}`, fetchOptions).
        then(checkXhrStatus).
        then(response => response.json()).
        catch(error => dispatch(handleTableError(error)));
    }
  };
}

export function tableShowPage(goals) {
  return {
    type: TABLE_SHOW_PAGE,
    goals
  };
}

export function handleTableError(error) {
  return {
    type: TABLE_ERROR,
    error
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
