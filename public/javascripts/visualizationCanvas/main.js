import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import a11y from 'react-a11y';
import createLogger from 'redux-logger';
import thunk from 'redux-thunk';
import createDebounce from 'redux-debounced';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import { t } from 'lib/I18n';

import visualizationCanvas from './reducer';
import App from './App';

import { fetchColumnStats } from './actions';

const middleware = [thunk, createDebounce()];

if (window.serverConfig.environment === 'development') {
  a11y(React, { ReactDOM: ReactDOM });
  middleware.push(createLogger({
    duration: true,
    timestamp: false,
    collapsed: true
  }));
}

const store = createStore(visualizationCanvas, applyMiddleware(...middleware));
store.dispatch(fetchColumnStats());

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
