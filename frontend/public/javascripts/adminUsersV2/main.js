import React from 'react';
import ReactDOM from 'react-dom';
import createLogger from 'redux-logger';
import thunk from 'redux-thunk';
import { createStore, applyMiddleware, compose } from 'redux';
import App from './app';
import reducer from './reducers';
import { AppContainer } from 'react-hot-loader';

const middleware = [
  thunk,
  createLogger({
    duration: true,
    timestamp: false,
    collapsed: true
  })
];
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(
  reducer(window.serverConfig),
  composeEnhancers(applyMiddleware(...middleware))
);

ReactDOM.render(
  <AppContainer>
    <App store={store} />
  </AppContainer>,
  document.querySelector('#app')
);

// Hot Module Replacement API
if (module.hot) {
  module.hot.accept('./app', () => {
    const NextApp = require('./app').default; //eslint-disable-line
    ReactDOM.render(
      <AppContainer>
        <NextApp store={store} />
      </AppContainer>,
      document.querySelector('#app')
    );
  });
}
