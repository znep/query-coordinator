import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';
import cx from 'classnames';
import eq from 'lodash/eq';

class RoutingTab extends Component {
  static contextTypes = {
    router: PropTypes.object
  };

  static propTypes = {
    to: PropTypes.string.isRequired,
    computeIsCurrent: PropTypes.func
  };

  static defaultProps = {
    computeIsCurrent: eq
  };

  render() {
    const { computeIsCurrent, to, ...props } = this.props;
    const { router: { location: { pathname } } } = this.context;
    const className = cx('tab-link', {
      current: computeIsCurrent(pathname, to)
    });
    return (
      <li className={className}>
        <Link to={to} {...props} />
      </li>
    );
  }
}

export default RoutingTab;
