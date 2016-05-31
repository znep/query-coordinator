import 'script!jquery';
import React from 'react'; // eslint-disable-line no-unused-vars
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import a11y from 'react-a11y';

import datasetLandingPage from './reducers';
import App from './App';

if (window.serverConfig.environment === 'development') {
  a11y(React, { ReactDOM: ReactDOM });
}

var store = createStore(datasetLandingPage, applyMiddleware(thunk));

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.querySelector('#app')
);

// Initialize the styleguide javascript components
var styleguide = require('socrata-styleguide');
styleguide(document);
