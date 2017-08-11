import React, { PropTypes } from 'react';
import { Modal as StyleGuideModal } from 'common/components';
import _ from 'lodash';
import ErrorsHelp from 'components/Modals/ErrorsHelpContainer';
import Publishing from 'components/Modals/PublishingContainer';
import PublishConfirmation from 'components/Modals/PublishConfirmationContainer';
import PublishConfirmationUSAID from 'components/Modals/PublishConfirmationUSAIDContainer';
import RowIdentifierError from 'components/Modals/RowIdentifierErrorContainer';
import styles from 'styles/Modals/Modal.scss';

// TODO: take modals out of [] when styleguide Modal component proptypes are corrrected
const getModalProps = (props, contentComponentName, payload) => {
  switch (contentComponentName) {
    case 'ErrorsHelp':
      return {
        ...props,
        children: [<ErrorsHelp key={1} />],
        className: styles.errorsHelp
      };

    case 'Publishing':
      return {
        ...props,
        children: [<Publishing key={1} />],
        className: styles.publishing,
        onDismiss: _.noop
      };

    case 'PublishConfirmation':
      return {
        ...props,
        children: [<PublishConfirmation key={1} />],
        className: styles.publishConfirmation
      };

    case 'PublishConfirmationUSAID':
      return {
        ...props,
        children: [<PublishConfirmationUSAID key={1} />],
        className: styles.publishConfirmation
      };

    case 'RowIdentifierError':
      return {
        ...props,
        children: [<RowIdentifierError key={1} result={payload} />],
        className: styles.rowIdentifierError
      };

    default:
      return props;
  }
};

const Modal = ({ modalState, onDismiss }) => {
  const { visible = false, contentComponentName, payload } = modalState;

  if (!visible) {
    return null;
  }

  const defaultProps = {
    children: [null],
    className: '',
    fullScreen: false,
    overlay: true,
    onDismiss
  };

  const modalProps = getModalProps(defaultProps, contentComponentName, payload);

  return (
    <div className={styles.container}>
      <StyleGuideModal {...modalProps} />
    </div>
  );
};

Modal.propTypes = {
  modalState: PropTypes.shape({
    visible: PropTypes.bool.isRequired,
    contentComponentName: PropTypes.string,
    payload: PropTypes.object
  }).isRequired,
  onDismiss: PropTypes.func.isRequired
};

export default Modal;
