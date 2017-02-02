import React from 'react';
import ReactDOM from 'react-dom';
import a11y from 'react-a11y';
// import airbrake from './lib/airbrake';
import _ from 'lodash';

import DummyCLP from './DummyCLP';

require('socrata-components/dist/css/styleguide.css');

// TODO: setup airbrake. remove a11y?
// if (window.serverConfig.environment === 'development') {
a11y(React, { ReactDOM: ReactDOM });
// } else {
//   airbrake.init();
// }

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
