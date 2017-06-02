import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'common/components';
import _ from 'lodash';
import classNames from 'classnames';

export class ActionModal extends React.Component {
  render() {
    const { actionType, assetActions, onAccept, onDismiss } = this.props;

    const getTranslation = (key) =>
      _.get(I18n, `result_list_table.action_modal.${_.snakeCase(actionType)}.${key}`);

    const modalProps = {
      fullScreen: false,
      onDismiss
    };

    const headerProps = {
      onDismiss,
      title: getTranslation('header')
    };

    const hasError = assetActions.performingActionFailure;
    const errorMessage = hasError ? (
      <div className="alert error">
        {getTranslation('error')}
      </div>
    ) : null;

    const acceptButtonText = assetActions.performingAction ?
      <span className="spinner-default spinner-small" /> : getTranslation('accept');
    const acceptButtonClass = classNames('accept-button btn btn-primary', { 'btn-error': hasError });

    return (
      <div className="action-modal">
        <Modal {...modalProps} >
          <ModalHeader {...headerProps} />

          <ModalContent>
            {getTranslation('description')}
            {errorMessage}
          </ModalContent>

          <ModalFooter>
            <button onClick={onDismiss} className="dismiss-button btn btn-default">
              {getTranslation('dismiss')}
            </button>
            <button onClick={onAccept} className={acceptButtonClass}>
              {acceptButtonText}
            </button>
          </ModalFooter>
        </Modal>
      </div>
    );
  }
}

ActionModal.propTypes = {
  actionType: PropTypes.string.isRequired,
  assetActions: PropTypes.object.isRequired,
  onAccept: PropTypes.func.isRequired,
  onDismiss: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
  assetActions: state.assetActions
});

export default connect(mapStateToProps)(ActionModal);
