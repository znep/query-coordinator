import PropTypes from 'prop-types';
import React from 'react';
import SocrataIcon from '../../../common/components/SocrataIcon';
import styles from './StatusText.module.scss';

const StatusText = ({ message, status }) => {
  let icon;

  switch (status) {
    case 'done':
      icon = <SocrataIcon name="checkmark3" className={styles.successIcon} />;
      break;
    case 'inProgress':
      icon = <span className={styles.spinner} />;
      break;
    default:
      icon = null;
  }

  return (
    <div className={styles.statusText}>
      {icon}
      {message}
    </div>
  );
};

StatusText.propTypes = {
  message: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired
};

export default StatusText;
