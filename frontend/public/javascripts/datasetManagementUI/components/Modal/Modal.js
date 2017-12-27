import PropTypes from 'prop-types';
import React from 'react';
import { Modal as StyleGuideModal } from 'common/components';
import _ from 'lodash';
import ErrorsHelp from 'containers/ErrorsHelpContainer';
import Publishing from 'containers/PublishingContainer';
import PublishConfirmation from 'containers/PublishConfirmationContainer';
import RowIdentifierError from 'containers/RowIdentifierErrorContainer';
import SetupAutomation from 'containers/SetupAutomationContainer';
import FormatColumn from 'containers/FormatColumnContainer';

import styles from './Modal.module.scss';

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
        className: `${styles.publishConfirmation} publish-confirmation`
      };

    case 'RowIdentifierError':
      return {
        ...props,
        children: [<RowIdentifierError key={1} result={payload} />],
        className: styles.rowIdentifierError
      };

    case 'FormatColumn':
      return {
        ...props,
        children: [<FormatColumn key={1} {...payload} />],
        className: styles.formatColumn
      };

    case 'SetupAutomation':
      return {
        ...props,
        children: [
          <SetupAutomation
            key={1}
            {...payload} />
        ],
        className: styles.setupAutomation
      };

    default:
      console.warn('Unknown modal', contentComponentName);
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
