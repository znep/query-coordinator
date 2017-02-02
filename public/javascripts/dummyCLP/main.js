import React from 'react';
import ReactDOM from 'react-dom';
import airbrake from '../common/airbrake';
import _ from 'lodash';
import DummyCLP from './DummyCLP';

require('socrata-components/dist/css/styleguide.css');

if (window.serverConfig.environment !== 'development') {
  airbrake.init();
}

_.defer(() => {
  try {
    ReactDOM.render(
      <DummyCLP />,
      document.querySelector('.dummy-clp')
    );
  } catch (e) {
    console.error(`Fatal error when rendering: ${e.stack}`);

    ReactDOM.render(
      <div className="alert error alert-full-width-top">Error</div>,
      document.querySelector('.dummy-clp')
    );

    return;
  }
});
