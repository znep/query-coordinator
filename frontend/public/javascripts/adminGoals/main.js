import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as Redux from 'redux';
import * as ReactRedux from 'react-redux';

import * as Middlewares from './middlewares';
import rootReducer from './reducers';

import App from './containers/App/App';

let middlewares = [
  Middlewares.thunk,
  Middlewares.notifyUser,
  Middlewares.fileDownloader
];

if (!window.mixpanelConfig.disabled) {
  Middlewares.analytics.initMixpanel();
  middlewares.push(Middlewares.analytics.mixpanel);
}

if (window.serverConfig.environment === 'development') {
  middlewares.push(Middlewares.createLogger());
}

let store = Redux.createStore(rootReducer, Redux.compose(
  Redux.applyMiddleware(...middlewares),
  window.devToolsExtension ? window.devToolsExtension() : f => f
));

ReactDOM.render(
  <ReactRedux.Provider store={store}>
    <App />
  </ReactRedux.Provider>,
  document.querySelector('#app'));
