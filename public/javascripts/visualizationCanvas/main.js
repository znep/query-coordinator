import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import a11y from 'react-a11y';
import createLogger from 'redux-logger';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';

import visualizationCanvas from './reducer';
import App from './App';

const middleware = [];

if (window.serverConfig.environment === 'development') {
  a11y(React, { ReactDOM: ReactDOM });
  middleware.push(createLogger({
    duration: true,
    timestamp: false,
    collapsed: true
  }));
}

const store = createStore(visualizationCanvas, applyMiddleware(...middleware));

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
  } catch (e) {
    console.error(`Fatal error when rendering: ${e.stack}`);

    ReactDOM.render(
      <div className="alert error alert-full-width-top">{I18n.render_error}</div>,
      document.querySelector('#app')
    );

    return;
  }

  // Show the footer
  var footer = document.querySelector('#site-chrome-footer');
  if (footer) {
    footer.style.visibility = 'visible';
  }
});