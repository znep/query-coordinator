import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import createLogger from 'redux-logger';
import a11y from 'react-a11y';
// import airbrake from './lib/airbrake';
// import components from 'socrata-components';
import _ from 'lodash';

import assetSelector from './reducers';
import App from './App';

require('socrata-components/dist/css/styleguide.css');

const middleware = [];

// TODO: setup a11y and airbrake
window.serverConfig = {};
// if (window.serverConfig.environment === 'development') {
a11y(React, { ReactDOM: ReactDOM });
middleware.push(createLogger({
  duration: true,
  timestamp: false,
  collapsed: true
}));
// } else {
//   airbrake.init();
// }

const store = createStore(assetSelector, applyMiddleware(...middleware));

_.defer(() => {
  document.querySelectorAll('.asset-selector').forEach((element) => {
    try {
      ReactDOM.render(
        <Provider store={store}>
          <App />
        </Provider>,
        element
      );
    } catch (e) {
      console.error(`Fatal error when rendering: ${e.stack}`);

      ReactDOM.render(
        <div className="alert error alert-full-width-top">Error</div>,
        element
      );

      return;
    }
  });

  // Initialize the javascript components
  // components.attachTo(document.querySelector('.asset-selector'));
});
