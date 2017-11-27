import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import I18n from 'common/i18n';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'common/components';

import { closeSigninModal, signin } from '../actions';

// Modal displayed when a user is not signed in with a link to sign in and return
export class SigninModal extends Component {

  render() {
    const { isActive, onDismiss, onClickSignin } = this.props;

    if (!isActive) {
      return null;
    }

    return (
      <Modal className="signin-modal" onDismiss={onDismiss}>
        <ModalHeader
          title={I18n.t('visualization_canvas.signin_modal.title')}
          onDismiss={onDismiss}
          className="signin-modal-header" />

        <ModalContent className="signin-modal-content">
          {I18n.t('visualization_canvas.signin_modal.description')}
        </ModalContent>

        <ModalFooter className="signin-modal-footer">
          <button className="btn btn-xs btn-default" onClick={onDismiss}>
            {I18n.t('visualization_canvas.signin_modal.dismiss_button')}
          </button>
          <button className="btn btn-xs btn-primary" onClick={onClickSignin}>
            {I18n.t('visualization_canvas.signin_modal.sign_in_button')}
          </button>
        </ModalFooter>
      </Modal>

    );
  }
}

SigninModal.propTypes = {
  // Whether or not the modal is active.
  // If false, nothing is rendered.
  isActive: PropTypes.bool.isRequired,

  // Called when the modal is dismissed.
  onDismiss: PropTypes.func.isRequired,

  // Called when the user clicks 'sign in'.
  onClickSignin: PropTypes.func.isRequired
};

function mapStateToProps(state) {
  return state.signinModal;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onDismiss: closeSigninModal,
    onClickSignin: signin
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SigninModal);
