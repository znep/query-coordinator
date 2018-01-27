import _ from 'lodash';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import createDebounce from 'redux-debounced';
import createLogger from 'redux-logger';

import { ModeStates } from 'common/performance_measures/lib/constants';

import rootReducer from './reducers';

import { fetchDataSourceView } from 'opMeasure/actions/editor';

const middleware = [thunk, createDebounce()];

if (window.serverConfig.environment === 'development') {
  middleware.push(createLogger({
    duration: true,
    timestamp: false,
    collapsed: true
  }));
}

const store = createStore(rootReducer, applyMiddleware(...middleware));

// Call store.dispatch on any actions that need to occur on initial store load.

// Prefetch data source if editing.
const dataSourceLensUid = _.get(window, 'socrata.opMeasure.measure.dataSourceLensUid');
if (dataSourceLensUid && socrata.opMeasure.mode === ModeStates.EDIT) {
  store.dispatch(fetchDataSourceView(dataSourceLensUid));
}

export default store;
