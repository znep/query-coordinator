import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import createDebounce from 'redux-debounced';
import createLogger from 'redux-logger';

import { middleware as mixpanelMiddleware } from './lib/mixpanel/middleware';
import visualizationCanvas from './reducer';
import { fetchColumnStats } from './actions';

const middleware = [thunk, createDebounce(), mixpanelMiddleware];

if (window.serverConfig.environment === 'development') {
  middleware.push(createLogger({
    duration: true,
    timestamp: false,
    collapsed: true
  }));
}

const store = createStore(visualizationCanvas, applyMiddleware(...middleware));

// Fire any actions that need to occur on initial store load.
store.dispatch(fetchColumnStats());

export default store;
