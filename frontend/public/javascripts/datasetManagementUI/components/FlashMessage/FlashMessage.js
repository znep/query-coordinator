import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

import { hideFlashMessage } from 'actions/flashMessage';
import SocrataIcon from '../../../common/components/SocrataIcon';
import styles from 'styles/FlashMessage/FlashMessage.scss';

export const FlashMessage = ({ kind, message, visible, onCloseClick }) => {
  let className;
  let iconName;
  let iconClass;

  switch (kind) {
    case 'success':
      className = styles.success;
      iconName = 'checkmark-alt';
      iconClass = styles.iconSuccess;
      break;
    case 'error':
      className = styles.error;
      iconName = 'warning';
      iconClass = styles.iconError;
      break;
    default:
      className = styles.base;
      iconName = 'info';
      iconClass = styles.icon;
      break;
  }

  if (visible) {
    return (
      <div className={className}>
        <SocrataIcon name={iconName} className={iconClass} />
        <SocrataIcon name="close-2" className={styles.closeButton} onIconClick={onCloseClick} />
        {message}
      </div>
    );
  } else {
    return null;
  }
};

FlashMessage.propTypes = {
  kind: PropTypes.string.isRequired,
  visible: PropTypes.bool.isRequired,
  onCloseClick: PropTypes.func.isRequired,
  message: PropTypes.string.isRequired
};

const mapStateToProps = ({ ui }) => ({
  kind: ui.flashMessage.kind,
  message: ui.flashMessage.message,
  visible: ui.flashMessage.visible
});

const mapDispatchToProps = dispatch => ({
  onCloseClick: () => dispatch(hideFlashMessage())
});

export default connect(mapStateToProps, mapDispatchToProps)(FlashMessage);
