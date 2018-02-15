import PropTypes from 'prop-types';
import React from 'react';
import SocrataIcon from '../../../common/components/SocrataIcon';
import { COL_STATUS } from 'datasetManagementUI/components/TransformStatus/TransformStatus';
import styles from './StatusText.module.scss';

const StatusText = ({ message, status }) => {
  let icon;

  switch (status) {
    case COL_STATUS.DONE:
      icon = <SocrataIcon name="checkmark3" className={styles.successIcon} />;
      break;
    case COL_STATUS.IN_PROGRESS:
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
