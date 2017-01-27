import 'script!jquery';
import 'babel-polyfill-safe';
import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import { Router, Route, IndexRoute, browserHistory } from 'react-router';
import { syncHistoryWithStore, routerMiddleware } from 'react-router-redux';
import createLogger from 'redux-logger';
import thunk from 'redux-thunk';
import a11y from 'react-a11y';
import windowDBMiddleware from './lib/database/middleware';
import * as Phoenix from 'phoenix';

import App from './components/App';
import ShowUpdate from './components/ShowUpdate';
import ManageMetadata from './components/ManageMetadata';
import ManageUploads from './components/ManageUploads';
import ShowOutputSchema from './components/ShowOutputSchema';
import ShowUpload from './components/ShowUpload';
import NoMatch from './components/NoMatch';
import rootReducer from './reducers';
import { bootstrap } from './lib/database/bootstrap';
import * as Selectors from './selectors';


const viewId = window.initialState.view.id;
window.DSMAPI_PHOENIX_SOCKET = new Phoenix.Socket('/api/update/socket', {
  params: {
    fourfour: viewId,
    token: window.serverConfig.websocketToken
  }
});
window.DSMAPI_PHOENIX_SOCKET.connect();

// middleware
const middleware = [thunk, routerMiddleware(browserHistory)];

if (window.serverConfig.environment === 'development') {
  a11y(React, { ReactDOM: ReactDOM });
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
  // TODO: setup airbrake if not development
}

const store = createStore(rootReducer, applyMiddleware(...middleware));
bootstrap(store, window.initialState.view, window.initialState.update);
const history = syncHistoryWithStore(browserHistory, store);

ReactDOM.render(
  <Provider store={store}>
    <Router history={history}>
      <Route path="/:category/:name/:fourfour/updates/:updateSeq" component={App}>
        <IndexRoute component={ShowUpdate} />
        <Route path="metadata" component={ManageMetadata} />
        <Route path="uploads" component={ManageUploads} />
        <Route path="uploads/:uploadId" component={ShowUpload} />
        <Route
          path="uploads/:uploadId/schemas/:inputSchemaId/output/:outputSchemaId"
          component={ShowOutputSchema} />
        <Route path="*" component={NoMatch} />
      </Route>
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
