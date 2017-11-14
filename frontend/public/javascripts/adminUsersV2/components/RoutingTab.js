import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';
import cx from 'classnames';

class RoutingTab extends Component {
  render() {
    const { to } = this.props;
    const { router: { location: { pathname }}} = this.context;
    const className = cx('tab-link', {
      current: to === pathname
    });
    return (
      <li className={className}><Link {...this.props} /></li>
    );
  }
}

RoutingTab.contextTypes = {
  router: PropTypes.object
};

export default RoutingTab;
