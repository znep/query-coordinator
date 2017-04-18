import React, { PropTypes } from 'react';
import { Modal as StyleGuideModal } from 'socrata-components';
import { connect } from 'react-redux';
import { hideModal } from 'actions/modal';
import styles from 'styles/Modals/Modal.scss';

const Modal = ({ visible = false, contentComponentName, onDismiss }) => {
  if (!visible) {
    return null;
  }

  return (
    <div className={styles.container}>
      <StyleGuideModal onDismiss={onDismiss}>
        <div>placeholder title</div>
        <div>placeholder</div>
      </StyleGuideModal>
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
