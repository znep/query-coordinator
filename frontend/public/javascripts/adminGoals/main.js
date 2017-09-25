import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as Redux from 'redux';
import * as ReactHotLoader from 'react-hot-loader';

import * as Middlewares from './middlewares';
import rootReducer from './reducers';

import Airbrake from 'common/airbrake';

import App from './containers/App/App';

let middlewares = [
  Middlewares.thunk,
  Middlewares.fileDownloader
];

if (!window.mixpanelConfig.disabled) {
  Middlewares.analytics.initMixpanel();
  middlewares.push(Middlewares.analytics.mixpanel);
}

if (window.serverConfig.environment === 'development') {
  middlewares.push(Middlewares.createLogger());
} else {
  Airbrake.init(window.serverConfig.airbrakeProjectId, window.serverConfig.airbrakeKey);
}

let store = Redux.createStore(rootReducer, Redux.compose(
  Redux.applyMiddleware(...middlewares),
  window.devToolsExtension ? window.devToolsExtension() : f => f
));

const translations = store.getState().get('translations');

ReactDOM.render(
  <ReactHotLoader.AppContainer>
    <App store={store} translations={translations} />
  </ReactHotLoader.AppContainer>,
  document.querySelector('#app')
);

// Hot Module Replacement API
if (module.hot) {
  module.hot.accept('./containers/App/App', () => {
    const NextApp = require('./containers/App/App').default; //eslint-disable-line
    ReactDOM.render(
      <ReactHotLoader.AppContainer>
        <NextApp store={store} translations={translations} />
      </ReactHotLoader.AppContainer>,
      document.querySelector('#app')
    );
  });
}
