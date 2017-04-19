import React, { PropTypes } from 'react';
import { Modal as StyleGuideModal } from 'socrata-components';
import { connect } from 'react-redux';
import { hideModal } from 'actions/modal';
import _ from 'lodash';
import styles from 'styles/Modals/Modal.scss';

import ErrorsHelp from 'components/Modals/ErrorsHelp';
import Publishing from 'components/Modals/Publishing';

// TODO: take modals out of [] when styleguide Modal component proptypes are corrrected
const getModalProps = (props, contentComponentName) => {
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
    default:
      return props;
  }
};

export const Modal = ({ visible = false, contentComponentName, onDismiss }) => {
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

  const modalProps = getModalProps(defaultProps, contentComponentName);

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
