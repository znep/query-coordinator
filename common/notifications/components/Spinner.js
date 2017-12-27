import React, { PureComponent } from 'react';
import cssModules from 'react-css-modules';

import styles from './spinner.module.scss';

class Spinner extends PureComponent {
  render() {
    return <div styleName="spinner" className="spinner-large" />;
  }
}

export default cssModules(Spinner, styles, { allowMultiple: true });
