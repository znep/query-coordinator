import 'script!jquery';
import 'babel-polyfill';
import React from 'react'; // eslint-disable-line no-unused-vars
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import createLogger from 'redux-logger';
import a11y from 'react-a11y';
import airbrake from './lib/airbrake';
import styleguide from 'socrata-styleguide';

import datasetLandingPage from './reducers';
import App from './App';
import DynamicContent from './DynamicContent';

// Update the csrf cookie to match the one from serverConfig, this is necessary to properly
// authenticate with core.
var csrfCookie = encodeURIComponent(window.serverConfig.csrfToken);
document.cookie = `socrata-csrf-token=${csrfCookie};secure;path=/`;

var middleware = [thunk];

if (window.serverConfig.environment === 'development') {
  a11y(React, { ReactDOM: ReactDOM });
  middleware.push(createLogger({
    duration: true,
    timestamp: false,
    collapsed: true
  }));
} else {
  airbrake.init();
}

var store = createStore(datasetLandingPage, applyMiddleware(...middleware));

// Render the main content
ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.querySelector('#app')
);

// Show the footer
var footer = document.querySelector('#site-chrome-footer');
if (footer) {
  footer.style.visibility = 'visible';
}

// Render the modals, flannels, etc. and bind styleguide events.
_.defer(function() {
  ReactDOM.render(
    <Provider store={store}>
      <DynamicContent />
    </Provider>,
    document.querySelector('#dynamic-content')
  );

  // Initialize the styleguide javascript components
  styleguide.attachTo(document);
});
