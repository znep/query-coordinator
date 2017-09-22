import PropTypes from 'prop-types';
import React from 'react';
import { Modal, ModalHeader, ModalContent } from 'common/components/Modal';
import I18n from 'common/i18n';

class PasswordHintModal extends React.Component {
  render() {
    const { onDismiss } = this.props;

    return (
      <Modal onDismiss={onDismiss}>
        <ModalHeader onDismiss={onDismiss} />

        <ModalContent>
          <div
            dangerouslySetInnerHTML={{
              __html: I18n.t('account.common.form.password_requirements_html')
            }} />
        </ModalContent>
      </Modal>
    );
  }
}

PasswordHintModal.propTypes = {
  onDismiss: PropTypes.func.isRequired
};

export default PasswordHintModal;
