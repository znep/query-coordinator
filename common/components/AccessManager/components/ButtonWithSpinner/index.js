import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import styles from './button-with-spinner.scss';

/**
 * A button that shows a spinner instead of text.
 *
 * Note that styleguide does have a "btn-busy" class that attempts
 * this, but it doesn't quite work right.
 */
class ButtonWithSpinner extends Component {
  static propTypes = {
    children: PropTypes.any,
    onClick: PropTypes.func,
    showSpinner: PropTypes.bool.isRequired,
    disabled: PropTypes.bool
  };

  static defaultProps = {
    children: null,
    onClick: () => {},
    showSpinner: false
  };

  renderContents = () => {
    const { children, showSpinner } = this.props;

    if (showSpinner) {
      return (<span className="spinner-default" styleName="spinner"></span>);
    } else {
      return children;
    }
  }

  render() {
    const { showSpinner, onClick, disabled } = this.props;
    return (
      <button
        type="submit"
        onClick={onClick}
        disabled={disabled}
        className="btn btn-primary"
        styleName={showSpinner ? 'button-with-spinner' : 'button-without-spinner'}>
      {this.renderContents()}
      </button>
    );
  }
}

export default cssModules(ButtonWithSpinner, styles);
