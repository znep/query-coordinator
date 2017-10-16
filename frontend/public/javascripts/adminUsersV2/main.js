import React from 'react';
import ReactDOM from 'react-dom';
import createLogger from 'redux-logger';
import thunk from 'redux-thunk';
import { createStore, applyMiddleware, compose } from 'redux';
import App from './app';
import reducer from './reducers';
import { AppContainer } from 'react-hot-loader';

const middleware = [thunk];
middleware.push(
  createLogger({
    duration: true,
    timestamp: false,
    collapsed: true
  })
);

const store = createStore(
  reducer,
  compose(
    applyMiddleware(...middleware),
    window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
  )
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
