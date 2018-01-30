import PropTypes from 'prop-types';
import React from 'react';
import {
  SAVED,
  UNSAVED,
  ERRORED,
  INITIALIZED
} from 'datasetManagementUI/components/ManageMetadata/ManageMetadata';
import SocrataIcon from 'common/components/SocrataIcon';

const StatusIndicator = ({ formStatus }) => {
  let colorClass;
  let iconName;

  switch (formStatus) {
    case INITIALIZED:
      colorClass = 'dsmp-status-initialized';
      break;
    case SAVED:
      colorClass = 'dsmp-status-saved';
      iconName = 'checkmark-alt';
      break;
    case UNSAVED:
      colorClass = 'dsmp-status-unsaved';
      iconName = 'pending';
      break;
    case ERRORED:
      colorClass = 'dsmp-status-errored';
      iconName = 'warning-alt';
      break;
    default:
      colorClass = 'dsmp-status-initialized';
  }

  return (
    <span id="status-indicator">
      {iconName ? <SocrataIcon name={iconName} className={colorClass} /> : <span className={colorClass} />}
    </span>
  );
};

StatusIndicator.propTypes = {
  formStatus: PropTypes.string.isRequired
};

export default StatusIndicator;
