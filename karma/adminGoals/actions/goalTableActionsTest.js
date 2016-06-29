import _ from 'lodash';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import Immutable from 'immutable';

import {
  tableLoadPage,
  cacheDashboards,
  cacheUsers,
  tableShowPage,
  handleTableError
} from 'actions/goalTableActions';


import {
  TABLE_SHOW_PAGE,
  TABLE_ERROR,
  CACHE_DASHBOARDS,
  CACHE_USERS,
  TABLE_ROW_SELECTED,
  TABLE_ROW_DESELECTED,
  TABLE_ROW_ALL_SELECTION_TOGGLE
} from 'actionTypes';

import responseDashboards from '../data/goalTableActions/responseDashboards';
import responseDashboardDetails from '../data/goalTableActions/responseDashboardDetails';
import responseUserDetails from '../data/goalTableActions/responseUserDetails';
import responseGoalDetails from '../data/goalTableActions/responseGoalDetails';

describe('actions/goalTableActions', function() {
  var server;
  const mockStore = configureStore([thunk]);

  let xhrResponsesForTableLoadPage = {};
  xhrResponsesForTableLoadPage['/stat/api/v1/dashboards'] = JSON.stringify(responseDashboards);

  _.each(responseDashboards, (dashboard) => {
    xhrResponsesForTableLoadPage[`/stat/api/v1/dashboards/${dashboard.id}`] = JSON.stringify(responseDashboardDetails[dashboard.id]);
  });

  _.each(responseUserDetails, (user) => {
    xhrResponsesForTableLoadPage[`/api/users/${user.id}.json`] = JSON.stringify(user);
  });

  _.each(responseGoalDetails, (goalDetail) => {
    xhrResponsesForTableLoadPage[`/stat/api/v1/goals/${goalDetail.id}`] = JSON.stringify(goalDetail);
  });

  beforeEach(function() {
    server = sinon.fakeServer.create();
    server.autoRespond = true;

    server.respondWith(xhr => {
      var response = _.get(xhrResponsesForTableLoadPage, xhr.url);

      if(!response) {
        xhr.respond(404, null, null);
      } else {
        xhr.respond(200, null, response);
      }
    });
  });

  afterEach(function () {
    server.restore();
  });

  it('tableLoadPage should load all goals with details', function(done) {
    const store = mockStore(Immutable.fromJS({
      goalTableData: {
        rowsPerPage: 100,
        currentPage: 1
      }
    }));
    return store.dispatch(tableLoadPage()).then(function() {
      var executedActions = store.getActions();

      var cacheDashboardsAction = _.find(executedActions, {type: CACHE_DASHBOARDS});
      expect(cacheDashboardsAction).to.not.eq(undefined);
      expect(_.keys(_.get(cacheDashboardsAction, 'dashboards')).length).to.eq(responseDashboards.length);

      var cacheUsersAction = _.find(executedActions, {type: CACHE_USERS});
      expect(cacheUsersAction).to.not.eq(undefined);
      expect(_.keys(_.get(cacheUsersAction, 'users')).length).to.eq(_.keys(responseUserDetails).length);

      var tableShowPageAction = _.find(executedActions, {type: TABLE_SHOW_PAGE});
      expect(tableShowPageAction).to.not.eq(undefined);
      expect(_.keys(_.get(tableShowPageAction, 'goals')).length).to.eq(_.keys(responseGoalDetails).length);

      done();
    });
  });

  it('tableLoadPage should just load 2 goals', function(done) {
    const store = mockStore(Immutable.fromJS({
      goalTableData: {
        rowsPerPage: 2,
        currentPage: 1
      }
    }));
    return store.dispatch(tableLoadPage()).then(function() {
      var executedActions = store.getActions();

      var tableShowPageAction = _.find(executedActions, {type: TABLE_SHOW_PAGE});
      expect(tableShowPageAction).to.not.eq(undefined);
      expect(_.keys(_.get(tableShowPageAction, 'goals')).length).to.eq(2);

      done();
    });
  });

  it('cacheDashboards should send dashboards to reducer', function() {
    var returnValue = cacheDashboards(responseDashboards);
    expect(returnValue).to.deep.eq({type: CACHE_DASHBOARDS, dashboards: responseDashboards});
  });

  it('cacheUsers should send users to reducer', function() {
    var returnValue = cacheUsers(responseUserDetails);
    expect(returnValue).to.deep.eq({type: CACHE_USERS, users: responseUserDetails});
  });

  it('tableShowPage should send goals to reducer', function() {
    var returnValue = tableShowPage(responseGoalDetails);
    expect(returnValue).to.deep.eq({type: TABLE_SHOW_PAGE, goals: responseGoalDetails});
  });

});
