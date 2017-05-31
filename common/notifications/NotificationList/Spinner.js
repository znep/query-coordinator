import React, { PureComponent } from 'react';
import cssModules from 'react-css-modules';
import styles from './list.scss';

class Spinner extends PureComponent {
  render() {
    return (
      <div>
        <div styleName="divider" />
        <div styleName="spinner" />
      </div>
    );
  }
}

export default cssModules(Spinner, styles);
