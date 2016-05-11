import 'script!jquery';
import React from 'react'; // eslint-disable-line no-unused-vars
import { render } from 'react-dom';
import { createStore } from 'redux';
import { Provider } from 'react-redux';

import datasetLandingPage from './reducers';
import App from './App';

var store = createStore(datasetLandingPage, window.initialState);

render(
  <Provider store={store}>
    <App/>
  </Provider>,
  document.querySelector('#app')
);

// Initialize the styleguide javascript components
var styleguide = require('socrata-styleguide');
styleguide(document);
