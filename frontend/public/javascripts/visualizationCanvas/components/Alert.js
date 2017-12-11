import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import classNames from 'classnames';

import I18n from 'common/i18n';
import { SocrataIcon } from 'common/components';

import { dismissAlert } from '../actions';

// Alert bar capable of showing warning or error messages
export class Alert extends Component {

  renderDismissButton() {
    const { onDismiss } = this.props;

    const buttonProps = {
      className: 'btn btn-transparent btn-dismiss',
      'aria-label': I18n.t('visualization_canvas.dismiss'),
      onClick: onDismiss
    };

    return (
      <button {...buttonProps}>
        <SocrataIcon name="close-2" />
      </button>
    );
  }

  render() {
    const { isActive, translationKey, type } = this.props;

    if (!isActive) {
      return null;
    }

    const alertClasses = classNames('alert', type || 'default');

    return (
      <div className="visualization-canvas-alert">
        <div className={alertClasses}>
          {I18n.t(translationKey)}
          {this.renderDismissButton()}
        </div>
      </div>
    );
  }
}

Alert.propTypes = {
  // Whether or not the modal is active.
  // If false, nothing is rendered.
  isActive: PropTypes.bool.isRequired,

  // Called when the modal is dismissed.
  onDismiss: PropTypes.func.isRequired,

  // The translation key for the content of the alert message
  translationKey: PropTypes.string.isRequired,

  // The type of alert, e.g. 'info', 'success', 'warning', 'error'
  type: PropTypes.string
};

function mapStateToProps(state) {
  return state.alert;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onDismiss: dismissAlert
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Alert);
