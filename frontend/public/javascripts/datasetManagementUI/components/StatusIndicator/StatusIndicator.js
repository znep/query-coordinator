import PropTypes from 'prop-types';
import React from 'react';
import {
  SAVED,
  UNSAVED,
  ERRORED,
  INITIALIZED
} from 'datasetManagementUI/components/ManageMetadata/ManageMetadata';
import styles from './StatusIndicator.module.scss';

const StatusIndicator = ({ formStatus }) => {
  let colorClass;

  switch (formStatus) {
    case INITIALIZED:
      colorClass = styles.base;
      break;
    case SAVED:
      colorClass = styles.saved;
      break;
    case UNSAVED:
      colorClass = styles.unsaved;
      break;
    case ERRORED:
      colorClass = styles.errored;
      break;
    default:
      colorClass = styles.base;
  }

  return <span className={colorClass}> </span>;
};

StatusIndicator.propTypes = {
  formStatus: PropTypes.string.isRequired
};

export default StatusIndicator;
