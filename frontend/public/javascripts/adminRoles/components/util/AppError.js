import React, { Component } from 'react';
import cssModules from 'react-css-modules';

import styles from './app-error.module.scss';

class AppError extends Component {
  render() {
    return (
      <div styleName="app-error">
        <div className="alert error">
          An error has occurred while loading data for this page. Please try reloading the page, or contact
          customer support if the problem persists.
        </div>
      </div>
    );
  }
}

export default cssModules(AppError, styles);
