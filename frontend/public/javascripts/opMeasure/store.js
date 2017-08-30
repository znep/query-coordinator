import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import createDebounce from 'redux-debounced';
import createLogger from 'redux-logger';

import rootReducer from './reducers';

const middleware = [thunk, createDebounce()];

if (window.serverConfig.environment === 'development') {
  middleware.push(createLogger({
    duration: true,
    timestamp: false,
    collapsed: true
  }));
}

const store = createStore(rootReducer, applyMiddleware(...middleware));

// TODO: Call store.dispatch on any actions that need to occur on initial store load.

export default store;
