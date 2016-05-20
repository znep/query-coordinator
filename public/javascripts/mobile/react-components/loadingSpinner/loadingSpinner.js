import React from 'react';
import classNames from 'classnames/bind';

import './loadingSpinner.scss';

class LoadingSpinner extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    var loaderClass = classNames('loading', { visible: this.props.visible });

    return <div className={ loaderClass }></div>;
  }
}

LoadingSpinner.propTypes = {};

export default LoadingSpinner;
