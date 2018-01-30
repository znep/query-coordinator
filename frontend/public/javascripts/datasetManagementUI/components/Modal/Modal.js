import PropTypes from 'prop-types';
import React from 'react';
import { Modal as StyleGuideModal } from 'common/components';
import _ from 'lodash';
import ErrorsHelp from 'datasetManagementUI/containers/ErrorsHelpContainer';
import Publishing from 'datasetManagementUI/containers/PublishingContainer';
import PublishConfirmation from 'datasetManagementUI/containers/PublishConfirmationContainer';
import RowIdentifierError from 'datasetManagementUI/containers/RowIdentifierErrorContainer';
import SetupAutomation from 'datasetManagementUI/containers/SetupAutomationContainer';
import FormatColumn from 'datasetManagementUI/containers/FormatColumnContainer';
import ManageMetadata from 'datasetManagementUI/containers/ManageMetadataModalContainer';

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

    case 'ManageMetadata':
      return {
        ...props,
        children: [
          <ManageMetadata key={1} />
        ]
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
