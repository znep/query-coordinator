import React, { Component } from 'react';
import PropTypes from 'prop-types';

const Count = ({ isLoading, name, count  }) => {
  const spinner = <span className="spinner-default" />;
  return (
    <div className="asset-counts-item">
      <div className="item-count">{isLoading ? spinner : count}</div>
      <div className="item-name">{name}</div>
    </div>
  );
};

Count.propTypes = {
  isLoading: PropTypes.bool,
  name: PropTypes.string,
  count: PropTypes.number
};


class AssetCounts extends Component {
  static Count = Count;
  static propTypes = {
    children: PropTypes.any.isRequired
  };

  render() {
    const { children } = this.props;
    return (
      <div className="asset-counts">
        {children}
      </div>
    );
  }
}

export default AssetCounts;
