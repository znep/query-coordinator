import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware, combineReducers } from 'redux';
import { Provider } from 'react-redux';
import createLogger from 'redux-logger';
import a11y from 'react-a11y';
// import airbrake from './lib/airbrake';
import _ from 'lodash';

import AssetSelectorWithExternalResourceWizard from './AssetSelectorWithExternalResourceWizard';

import assetSelector from '../assetSelector/reducers';
import externalResourceWizard from '../externalResourceWizard/reducers';

require('socrata-components/dist/css/styleguide.css');

const middleware = [];

// TODO: setup a11y and airbrake
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

const reducers = combineReducers({
  assetSelector,
  externalResourceWizard
});

const store = createStore(reducers, applyMiddleware(...middleware));

_.defer(() => {
  try {
    ReactDOM.render(
      <Provider store={store}>
        <AssetSelectorWithExternalResourceWizard
          category={'Education'}
          resultsPerPage={6} />
      </Provider>,
      document.querySelector('.asset-selector')
    );
  } catch (e) {
    console.error(`Fatal error when rendering: ${e.stack}`);

    ReactDOM.render(
      <div className="alert error alert-full-width-top">Error</div>,
      document.querySelector('.asset-selector')
    );

    return;
  }
});
