import React, { PropTypes } from 'react';
import _ from 'lodash';
import I18n from 'common/i18n';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'common/components/Modal';
import ModalConfigPropType from '../PropTypes/ModalConfigPropType';

class LoginModal extends React.Component {
  render() {
    const {
      modalConfig,
      onCancel,
      onConfirm
    } = this.props;

    const acceptButtonText = _.get(
      modalConfig,
      'acceptButtonText',
      I18n.t('screens.sign_in.modal_default_accept')
    );

    const headerText = _.get(modalConfig, 'title', I18n.t('screens.sign_in.modal_default_header'));

    // there is validation in rails AND proptypes for this field,
    // so it _should_ always be there
    const text = _.get(modalConfig, 'text', 'ERROR: Missing text config value for modal!');

    const hideCancelButton = _.get(modalConfig, 'hideCancelButton', false);
    const cancelButtonText = _.get(
      modalConfig,
      'cancelButtonText',
      I18n.t('screens.sign_in.modal_default_cancel')
    );

    const modalProps = {
      fullScreen: false,
      onDismiss: () => { } // don't allow clicking outside to hide
    };

    const headerProps = {
      showCloseButton: false,
      title: headerText,
      onDismiss: () => { this.cancelModal(); }
    };

    const renderCancelButton = (hideButton) => {
      if (hideButton) {
        return null;
      }

      return (
        <button className="btn btn-default" onClick={() => { onCancel(); }}>
          {cancelButtonText}
        </button>
      );
    };

    return (
      <Modal {...modalProps}>
        <ModalHeader {...headerProps} />

        <ModalContent>
          {/* This value is only set by us, so dangerous inner HTML is okay */}
          <div dangerouslySetInnerHTML={{ __html: text }} />
        </ModalContent>

        <ModalFooter>
          <div>
            {renderCancelButton(hideCancelButton)}
            {' '}
            <button className="btn btn-primary" onClick={() => { onConfirm(); }}>
              {acceptButtonText}
            </button>
          </div>
        </ModalFooter>
      </Modal>
    );
  }
}

LoginModal.propTypes = {
  modalConfig: ModalConfigPropType.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default LoginModal;
