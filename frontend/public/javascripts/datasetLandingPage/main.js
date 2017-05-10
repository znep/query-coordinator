import 'babel-polyfill-safe';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import components from 'socrata-components';
import utils from 'socrata-utils';

import airbrake from '../common/airbrake';
import store from './store';
import App from './App';
import DynamicContent from './DynamicContent';

// Update the csrf cookie to match the one from serverConfig, this is necessary to properly
// authenticate with core.
const csrfCookie = encodeURIComponent(window.serverConfig.csrfToken);
document.cookie = `socrata-csrf-token=${csrfCookie};secure;path=/`;

// Register with Airbrake in non-dev environments.
if (window.serverConfig.environment !== 'development') {
  airbrake.init(window.serverConfig.airbrakeProjectId, window.serverConfig.airbrakeKey);
}

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

    // initialize internal analytics
    const analytics = new utils.Analytics();

    // queue the metrics that the page was visited
    analytics.sendMetric('domain', 'js-page-view', 1);
    analytics.sendMetric('domain', 'js-page-view-dataset', 1);

    // flush the metrics queue to dispatch everything
    analytics.flushMetrics();
  });
});
