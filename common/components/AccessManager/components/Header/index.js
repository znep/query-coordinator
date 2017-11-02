import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import cssModules from 'react-css-modules';
import styles from './header.scss';

/**
 * Simple header for the top of the modal.
 *
 * The title and subtitle can be changed via the state, if so desired.
 */
class Header extends Component {
  static propTypes = {
    title: PropTypes.string,
    subtitle: PropTypes.string
  };

  static defaultProps = {
    title: '',
    subtitle: ''
  };

  render() {
    const { title, subtitle } = this.props;
    return (
      <header styleName="header">
        <h2>{title}</h2>
        {subtitle}
      </header>
    );
  }
}

const mapStateToProps = state => ({
  title: state.accessManager.headerText,
  subtitle: state.accessManager.headerSubtitle
});

export default connect(mapStateToProps)(cssModules(Header, styles));
