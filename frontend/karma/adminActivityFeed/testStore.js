import { fromJS } from 'immutable';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

import serviceLocator from 'adminActivityFeed/middlewares/serviceLocator';

import adminActivityFeedReducer from 'adminActivityFeed/reducer';

export default function getDefaultStore(activityFeedApi, initialState = {}) {
  return createStore(adminActivityFeedReducer, fromJS(initialState), applyMiddleware(serviceLocator({
    api: activityFeedApi
  }),thunk));
}
