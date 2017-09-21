import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import createLogger from 'redux-logger';

import datasetLandingPage from './reducers';
import { fetchRowCount, checkSubscription } from './actions/view';

const middleware = [thunk];

if (window.serverConfig.environment === 'development') {
  middleware.push(createLogger({
    duration: true,
    timestamp: false,
    collapsed: true
  }));
}

const store = createStore(datasetLandingPage, applyMiddleware(...middleware));

// Fire any actions that need to occur on initial store load.
store.dispatch(fetchRowCount());
store.dispatch(checkSubscription());

export default store;
