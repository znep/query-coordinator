import React, { PropTypes } from 'react';
import { Modal as StyleGuideModal } from 'socrata-components';
import { connect } from 'react-redux';
import { hideModal } from 'actions/modal';
import styles from 'styles/Modals/Modal.scss';

import ErrorsHelp from 'components/Modals/ErrorsHelp';

const Modal = ({ visible = false, contentComponentName, onDismiss }) => {
  if (!visible) {
    return null;
  }

  let modalProps = {
    children: null,
    className: '',
    fullScreen: false,
    overlay: true,
    onDismiss
  };

  switch (contentComponentName) {
    case 'ErrorsHelp':
      modalProps.children = <ErrorsHelp />;
      modalProps.className = styles.errorsHelp;
      break;
    default:
      modalProps.children = null;
  }

  return (
    <div className={styles.container}>
      <StyleGuideModal {...modalProps} />
    </div>
  );
};

Modal.propTypes = {
  visible: PropTypes.bool,
  onDismiss: PropTypes.func.isRequired,
  contentComponentName: PropTypes.string
};

const mapStateToProps = ({ modal }) => ({
  visible: modal.visible,
  contentComponentName: modal.contentComponentName
});

const mapDispatchToProps = (dispatch) => ({
  onDismiss: () => dispatch(hideModal())
});

export default connect(mapStateToProps, mapDispatchToProps)(Modal);
