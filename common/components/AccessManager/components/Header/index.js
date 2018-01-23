import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import cssModules from 'react-css-modules';

import I18n from 'common/i18n';

import styles from './header.module.scss';

/**
 * Simple header for the top of the modal.
 *
 * The title and subtitle can be changed via the state, if so desired.
 */
class Header extends Component {
  static propTypes = {
    mode: PropTypes.string
  }

  static defaultProps = {
    mode: null
  }

  render() {
    const { mode } = this.props;
    return (
      <header styleName="header">
        <h2>{I18n.t(`shared.site_chrome.access_manager.${mode}.title`)}</h2>
        {I18n.t(`shared.site_chrome.access_manager.${mode}.subtitle`)}
      </header>
    );
  }
}

const mapStateToProps = state => ({
  mode: state.ui.mode
});

export default connect(mapStateToProps)(cssModules(Header, styles));
