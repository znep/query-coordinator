import PropTypes from 'prop-types';
import React from 'react';
import {
  SAVED,
  UNSAVED,
  ERRORED,
  INITIALIZED
} from 'datasetManagementUI/components/ManageMetadata/ManageMetadata';

const StatusIndicator = ({ formStatus }) => {
  let colorClass = 'dsmp-status-base';

  switch (formStatus) {
    case INITIALIZED:
      colorClass += ' dsmp-status-initialized';
      break;
    case SAVED:
      colorClass += ' dsmp-status-saved';
      break;
    case UNSAVED:
      colorClass += ' dsmp-status-unsaved';
      break;
    case ERRORED:
      colorClass += ' dsmp-status-errored';
      break;
    default:
      colorClass += ' dsmp-status-initialized';
  }

  return <span className={colorClass} />;
};

StatusIndicator.propTypes = {
  formStatus: PropTypes.string.isRequired
};

export default StatusIndicator;
