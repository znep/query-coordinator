import 'script!jquery';
import React from 'react'; // eslint-disable-line no-unused-vars
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import createLogger from 'redux-logger';
import a11y from 'react-a11y';
import airbrake from './lib/airbrake';

import datasetLandingPage from './reducers';
import App from './App';

var middleware = [thunk];

if (window.serverConfig.environment === 'development') {
  a11y(React, { ReactDOM: ReactDOM });
  middleware.push(createLogger());
} else {
  airbrake.init();
}

var store = createStore(datasetLandingPage, applyMiddleware(...middleware));

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.querySelector('#app')
);

// Initialize the styleguide javascript components
var styleguide = require('socrata-styleguide');
styleguide(document);
