import _ from 'lodash';
window._ = _;
import 'babel-polyfill-safe';
import React from 'react';
import ReactDOM from 'react-dom';
import components from 'common/components';
import { Analytics } from 'common/analytics';
import { Provider } from 'react-redux';
import * as metrics from '../common/metrics';
import airbrake from 'common/airbrake';
import dslpCrossOriginErrorsFilter from 'common/airbrake/filters/dslp_cross_origin_errors';
import store from './store';
import Root from './root';
import { AppContainer } from 'react-hot-loader';
import DynamicContent from './DynamicContent';

// Update the csrf cookie to match the one from serverConfig, this is necessary to properly
// authenticate with core.
const csrfCookie = encodeURIComponent(window.serverConfig.csrfToken);
document.cookie = `socrata-csrf-token=${csrfCookie};secure;path=/`;

// Register with Airbrake in non-dev environments.

if (window.serverConfig.environment !== 'development') {
  airbrake.init(window.serverConfig.airbrakeProjectId, window.serverConfig.airbrakeKey);
  airbrake.addFilter(dslpCrossOriginErrorsFilter);
}

// Defer rendering so the spinner in the erb can render.
_.defer(() => {
  if (window.lastAccessed) { window.lastAccessed.add(window.initialState.view.id); }

  // Render the App, falling back to rendering an error if it fails.
  try {
    ReactDOM.render(
      <AppContainer>
        <Root store={store} />
      </AppContainer>,
      document.querySelector('#app')
    );

    // Hot Module Replacement API
    if (module.hot) {
      module.hot.accept('./root', () => {
        const NextRoot = require('./root').default; //eslint-disable-line
        ReactDOM.render(
          <AppContainer>
            <NextRoot store={store} />
          </AppContainer>,
          document.querySelector('#app')
        );
      });
    }
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
    const analytics = new Analytics();

    // queue the metrics that the page was visited
    analytics.sendMetric('domain', 'js-page-view', 1);
    analytics.sendMetric('domain', 'js-page-view-dataset', 1);

    // flush the metrics queue to dispatch everything
    analytics.flushMetrics();

    /*
      EN-15722: sending metrics through Analytics exclusively is not safe due to a known bug
      That is why we are sending metrics again through core because it has been confirmed as the most robust route
      This request prompts core to create metrics of type `view-loaded`, which are the metrics that we actually surface in `viewCount` on `/api/views/4x4`
      and on endpoint `4x4/stats`
    */
    metrics.sendAnalytics(window.initialState.view.id);
  });
});
