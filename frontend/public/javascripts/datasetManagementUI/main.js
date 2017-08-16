import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, compose } from 'redux';
import { Provider } from 'react-redux';
import { Router, browserHistory } from 'react-router';
import Perf from 'react-addons-perf';
import middleware from 'middleware';
import rootReducer from 'reducers/rootReducer';
import * as Selectors from './selectors';
import Airbrake from 'common/airbrake';
import rootRoute from './routes';
import { addLocation } from 'actions/history';
import styleguide from './styles/style.global.scss'; //eslint-disable-line

if (window.serverConfig.environment === 'development') {
  window.Perf = Perf;
} else {
  // 126728 is Publishing airbrake project id
  Airbrake.init(window.serverConfig.airbrakeProjectId, window.serverConfig.airbrakeKey);
}

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(rootReducer, composeEnhancers(middleware));

browserHistory.listen(location => {
  store.dispatch(addLocation(location));
});

ReactDOM.render(
  <Provider store={store}>
    <Router history={browserHistory}>
      {rootRoute(store)}
    </Router>
  </Provider>,
  document.querySelector('#app')
);

window.addEventListener('beforeunload', evt => {
  const sourcesInProgress = Selectors.sourcesInProgress(store.getState().ui.apiCalls);
  if (sourcesInProgress.length !== 0) {
    const msg = I18n.source_warning;
    evt.returnValue = msg;
    return msg;
  }
});
