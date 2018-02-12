import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { COL_STATUS } from 'datasetManagementUI/components/TransformStatus/TransformStatus';
import styles from './ProgressBar.module.scss';

export default function ProgressBar({ percent, ariaLabel, ariaLabeledBy, type, className }) {
  const ariaLabelProp = {};

  if (ariaLabel) {
    ariaLabelProp['aria-label'] = ariaLabel;
  }

  if (ariaLabeledBy) {
    ariaLabelProp['aria-labelledby'] = ariaLabeledBy;
  }

  let classNames = [styles.container]; // eslint-disable-line

  className && classNames.push(className); // eslint-disable-line

  let progressBar;

  switch (type) {
    case 'success':
      progressBar = styles.progressBarSuccess;
      break;
    case COL_STATUS.ERROR:
      progressBar = styles.progressBarError;
      break;
    case COL_STATUS.IN_PROGRESS:
      progressBar = styles.progressBarInProgress;
      break;
    case COL_STATUS.DONE:
      progressBar = styles.progressBarDone;
      break;
    case COL_STATUS.UNLOADED:
      progressBar = styles.progressBarDone;
      break;
    default:
      progressBar = styles.progressBarDefault;
  }

  return (
    <div
      className={classNames.join(' ')}
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin="0"
      aria-valuemax="100">
      <div className={progressBar} style={{ width: `${percent}%` }} />
    </div>
  );
}

ProgressBar.propTypes = {
  percent: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  ariaLabel: PropTypes.string,
  ariaLabeledBy: PropTypes.string,
  type: PropTypes.oneOf(['success', ..._.values(COL_STATUS)]),
  className: PropTypes.string
};
