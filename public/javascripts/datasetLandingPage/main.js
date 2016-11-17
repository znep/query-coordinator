import 'babel-polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import createLogger from 'redux-logger';
import a11y from 'react-a11y';
import airbrake from './lib/airbrake';
import components from 'socrata-components';

import datasetLandingPage from './reducers';
import App from './App';
import DynamicContent from './DynamicContent';

// Update the csrf cookie to match the one from serverConfig, this is necessary to properly
// authenticate with core.
const csrfCookie = encodeURIComponent(window.serverConfig.csrfToken);
document.cookie = `socrata-csrf-token=${csrfCookie};secure;path=/`;

const middleware = [thunk];

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

const store = createStore(datasetLandingPage, applyMiddleware(...middleware));

// Defer rendering so the spinner in the erb can render.
_.defer(() => {

  // Render the App, falling back to rendering an error if it fails.
  try {
    ReactDOM.render(
      <Provider store={store}>
        <App />
      </Provider>,
      document.querySelector('#app')
    );
  } catch (e) {
    console.error(`Fatal error when rendering: ${e.stack}`);

    ReactDOM.render(
      <div className="alert error alert-full-width-top">{I18n.render_error}</div>,
      document.querySelector('#app')
    );

    return;
  }

  // Show the footer
  const footer = document.querySelector('#site-chrome-footer');
  if (footer) {
    footer.style.visibility = 'visible';
  }

  // Flush the app to the browser and render the modals, flannels, etc.
  _.defer(() => {
    ReactDOM.render(
      <Provider store={store}>
        <DynamicContent />
      </Provider>,
      document.querySelector('#dynamic-content')
    );

    // Initialize the javascript components
    components.attachTo(document.querySelector('.dataset-landing-page'));
  });
});
