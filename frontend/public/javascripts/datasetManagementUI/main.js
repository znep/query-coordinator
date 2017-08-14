import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { Router, browserHistory } from 'react-router';
import Perf from 'react-addons-perf';
import { bootstrapApp } from 'reduxStuff/actions/bootstrap';
import * as Selectors from './selectors';
import Airbrake from 'common/airbrake';
import rootRoute from './routes';
import { addLocation } from 'reduxStuff/actions/history';
import styleguide from './styles/style.global.scss'; //eslint-disable-line
import store from 'reduxStuff/store';

if (window.serverConfig.environment === 'development') {
  window.Perf = Perf;
} else {
  // 126728 is Publishing airbrake project id
  Airbrake.init(window.serverConfig.airbrakeProjectId, window.serverConfig.airbrakeKey);
}

store.dispatch(
  bootstrapApp(
    window.initialState.view,
    window.initialState.revision,
    window.initialState.customMetadataFieldsets
  )
);

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
