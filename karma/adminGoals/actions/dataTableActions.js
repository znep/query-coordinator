import _ from 'lodash';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import {
  tableLoadPage,
  cacheDashboards,
  cacheUsers,
  tableShowPage,
  handleTableError
} from 'actions/dataTableActions';


import {
  TABLE_SHOW_PAGE,
  TABLE_ERROR,
  CACHE_DASHBOARDS,
  CACHE_USERS
} from 'actionTypes';

import responseDashboards from '../data/dataTableActions/responseDashboards';
import responseDashboardDetails from '../data/dataTableActions/responseDashboardDetails';
import responseUserDetails from '../data/dataTableActions/responseUserDetails';
import responseGoalDetails from '../data/dataTableActions/responseGoalDetails';

describe('actions/dataTableActions', function() {
  var server;
  const mockStore = configureStore([thunk]);

  beforeEach(function() {
    server = sinon.fakeServer.create();
    server.autoRespond = true;
  });

  afterEach(function () {
    server.restore();
  });

  it('tableLoadPage should load all goals with details', function(done) {
    let xhrResponses = {};
    xhrResponses['/stat/api/v1/dashboards'] = JSON.stringify(responseDashboards);

    _.each(responseDashboards, (dashboard) => {
      xhrResponses[`/stat/api/v1/dashboards/${dashboard.id}`] = JSON.stringify(responseDashboardDetails[dashboard.id]);
    });

    _.each(responseUserDetails, (user) => {
      xhrResponses[`/api/users/${user.id}.json`] = JSON.stringify(user);
    });

    _.each(responseGoalDetails, (goalDetail) => {
      xhrResponses[`/stat/api/v1/goals/${goalDetail.id}`] = JSON.stringify(goalDetail);
    });

    server.respondWith(xhr => {
      var response = _.get(xhrResponses, xhr.url);

      if(!response) {
        xhr.respond(404, null, null);
      } else {
        xhr.respond(200, null, response);
      }
    });

    const store = mockStore({});
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
