import 'babel-polyfill-safe';
import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import createLogger from 'redux-logger';
import thunk from 'redux-thunk';
import createDebounce from 'redux-debounced';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import { t } from 'lib/I18n';
import confirmUnload from 'lib/confirmUnload';

import utils from 'socrata-utils';

import * as metrics from '../common/metrics';
import airbrake from 'common/airbrake';

import '../common/mixpanel'; // This initializes mixpanel

// add styling for socrata-viz maps
import 'leaflet/dist/leaflet.css';

import visualizationCanvas from './reducer';
import App from './App';

import { fetchColumnStats } from './actions';

const middleware = [thunk, createDebounce()];

if (window.serverConfig.environment === 'development') {
  middleware.push(createLogger({
    duration: true,
    timestamp: false,
    collapsed: true
  }));
} else {
  airbrake.init(window.serverConfig.airbrakeProjectId, window.serverConfig.airbrakeKey);
}

const store = createStore(visualizationCanvas, applyMiddleware(...middleware));
store.dispatch(fetchColumnStats());

window.onbeforeunload = confirmUnload(store);

// Defer rendering so the spinner in the erb can render.
_.defer(function() {

  // Render the App, falling back to rendering an error if it fails.
  try {
    ReactDOM.render(
      <Provider store={store}>
        <App />
      </Provider>,
      document.querySelector('#app')
    );

    // initialize internal analytics
    const analytics = new utils.Analytics();
    analytics.sendMetric('domain', 'js-page-view', 1);
    analytics.sendMetric('domain', 'js-page-view-visualization', 1);

    // flush the metrics queue to dispatch everything
    analytics.flushMetrics();

    /*
      EN-15722: sending metrics through socrata-utils exclusively is not safe due to a known bug
      That is why we are sending metrics again through core because it has been confirmed as the most robust route
      This request prompts core to create metrics of type `view-loaded`, which are the metrics that we actually surface in `viewCount` on `/api/views/4x4`
      and on endpoint `4x4/stats`
    */
    if (!window.initialState.isEphemeral) {
      metrics.sendAnalytics(window.initialState.view.id);
    }
  } catch (e) {
    console.error(`Fatal error when rendering: ${e.stack}`);

    ReactDOM.render(
      <div className="alert error alert-full-width-top">{t('render_error')}</div>,
      document.querySelector('.placeholder-wrapper')
    );

    return;
  }

  // Show the footer
  const footer = document.querySelector('#site-chrome-footer');
  if (footer) {
    footer.style.visibility = 'visible';
  }
});
