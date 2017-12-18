import React from 'react';
import ReactDOM from 'react-dom';
import { browserHistory } from 'react-router';
import Perf from 'react-addons-perf';
import * as Selectors from './selectors';
import Airbrake from 'common/airbrake';
import { addLocation } from 'reduxStuff/actions/history';
import styleguide from './styles/style.global.scss'; //eslint-disable-line
import store from 'reduxStuff/store';
import { AppContainer } from 'react-hot-loader';
import App from 'components/App/App';

if (window.serverConfig.environment === 'development') {
  window.Perf = Perf;
  window.store = store;
} else {
  // 126728 is Publishing airbrake project id
  Airbrake.init(window.serverConfig.airbrakeProjectId, window.serverConfig.airbrakeKey);
}

browserHistory.listen(location => {
  store.dispatch(addLocation(location));
});

ReactDOM.render(
  <AppContainer>
    <App store={store} history={browserHistory} />
  </AppContainer>,
  document.getElementById('app')
);

// Hot Module Replacement API
if (module.hot) {
  module.hot.accept('components/App/App', () => {
    const NextApp = require('components/App/App').default; //eslint-disable-line
    ReactDOM.render(
      <AppContainer>
        <NextApp store={store} history={browserHistory} />
      </AppContainer>,
      document.getElementById('app')
    );
  });
}

window.addEventListener('beforeunload', evt => {
  const sourcesInProgress = Selectors.sourcesInProgress(store.getState().ui.apiCalls);
  if (sourcesInProgress.length !== 0) {
    const msg = I18n.source_warning;
    evt.returnValue = msg;
    return msg;
  }
});
