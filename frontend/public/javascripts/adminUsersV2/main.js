import React from 'react';
import ReactDOM from 'react-dom';
import createLogger from 'redux-logger';
import { createStore, applyMiddleware, compose } from 'redux';
import createSagaMiddleware from 'redux-saga';
import App from './app';
import rootReducer from './reducers';
import { AppContainer } from 'react-hot-loader';
import sagas from './sagas';

const sagaMiddleware = createSagaMiddleware();

const middleware = [
  sagaMiddleware,
  createLogger({
    duration: true,
    timestamp: false,
    collapsed: true
  })
];
const composeEnhancers =
  (window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ &&
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({ name: 'Users & Teams Admin' })) ||
  compose;

const preloadedState = {
  config: window.serverConfig
};
const store = createStore(rootReducer, preloadedState, composeEnhancers(applyMiddleware(...middleware)));
sagaMiddleware.run(sagas);

const render = Component => {
  ReactDOM.render(
    <AppContainer>
      <Component store={store} />
    </AppContainer>,
    document.querySelector('#app')
  );
};

render(App);

// Hot Module Replacement API
if (module.hot) {
  module.hot.accept('./app', () => {
    const NextApp = require('./app').default; //eslint-disable-line
    render(NextApp);
  });
}
