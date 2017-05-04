import React, { PropTypes } from 'react';
import { Modal as StyleGuideModal } from 'socrata-components';
import { connect } from 'react-redux';
import { hideModal } from 'actions/modal';
import _ from 'lodash';
import styles from 'styles/Modals/Modal.scss';

import ErrorsHelp from 'components/Modals/ErrorsHelp';
import Publishing from 'components/Modals/Publishing';
import PublishConfirmation from 'components/Modals/PublishConfirmation';
import RowIdentifierError from 'components/Modals/RowIdentifierError';

// TODO: take modals out of [] when styleguide Modal component proptypes are corrrected
const getModalProps = (props, contentComponentName, payload) => {
  switch (contentComponentName) {
    case 'ErrorsHelp':
      return {
        ...props,
        children: ([<ErrorsHelp key={1} />]),
        className: styles.errorsHelp
      };

    case 'Publishing':
      return {
        ...props,
        children: ([<Publishing key={1} />]),
        className: styles.publishing,
        onDismiss: _.noop
      };

    case 'PublishConfirmation':
      return {
        ...props,
        children: ([<PublishConfirmation key={1} />]),
        className: styles.publishConfirmation
      };

    case 'RowIdentifierError':
      return {
        ...props,
        children: ([<RowIdentifierError key={1} result={payload} />]),
        className: styles.rowIdentifierError
      };

    default:
      return props;
  }
};

export const Modal = ({ modalState, onDismiss }) => {
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

const mapStateToProps = ({ modal }) => ({
  modalState: modal
});

const mapDispatchToProps = (dispatch) => ({
  onDismiss: () => dispatch(hideModal())
});

export default connect(mapStateToProps, mapDispatchToProps)(Modal);
