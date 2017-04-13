import 'babel-polyfill-safe';
import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware, compose } from 'redux';
import { Provider } from 'react-redux';
import { Router, browserHistory } from 'react-router';
import { syncHistoryWithStore, routerMiddleware } from 'react-router-redux';
import createLogger from 'redux-logger';
import thunk from 'redux-thunk';
import windowDBMiddleware from './lib/database/middleware';
import * as Phoenix from 'phoenix';
import Perf from 'react-addons-perf';

import rootReducer from './reducers';
import { bootstrap } from './bootstrap';
import * as Selectors from './selectors';
import Airbrake from '../common/airbrake';
import rootRoute from './routes';
import styleguide from './styles/style.global.scss'; //eslint-disable-line

const viewId = window.initialState.view.id;

window.DSMAPI_PHOENIX_SOCKET = new Phoenix.Socket('/api/publishing/v1/socket', {
  params: {
    fourfour: viewId,
    token: window.serverConfig.websocketToken
  }
});
window.DSMAPI_PHOENIX_SOCKET.connect();

// middleware
const middleware = [thunk, routerMiddleware(browserHistory)];

if (window.serverConfig.environment === 'development') {
  window.Perf = Perf;

  middleware.push(createLogger({
    duration: true,
    timestamp: false,
    collapsed: true,
    logErrors: false
  }));
  middleware.push(windowDBMiddleware);
  console.log(
    'for convenience, try e.g. `console.table(DB.uploads)` (only works when RAILS_ENV==development)'
  );
} else {
  Airbrake.init();
}

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(rootReducer, composeEnhancers(
  applyMiddleware(...middleware)
));
bootstrap(store, window.initialState.view, window.initialState.update);
const history = syncHistoryWithStore(browserHistory, store);

ReactDOM.render(
  <Provider store={store}>
    <Router history={history}>
      {rootRoute(store)}
    </Router>
  </Provider>,
  document.querySelector('#app')
);

window.addEventListener('beforeunload', (evt) => {
  const uploadsInProgress = Selectors.uploadsInProgress(store.getState().db);
  if (uploadsInProgress.length !== 0) {
    const msg = I18n.upload_warning;
    evt.returnValue = msg;
    return msg;
  }
});