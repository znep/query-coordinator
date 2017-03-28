import React, { PropTypes } from 'react';
import styles from 'styles/ProgressBar.scss';

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
    case 'error':
      progressBar = styles.progressBarError;
      break;
    case 'inProgress':
      progressBar = styles.progressBarInProgress;
      break;
    case 'done':
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
      aria-valuemax="100"
      {...ariaLabelProp}>
      <div className={progressBar} style={{ width: `${percent}%` }} />
    </div>
  );
}

ProgressBar.propTypes = {
  percent: PropTypes.number.isRequired,
  ariaLabel: PropTypes.string,
  ariaLabeledBy: PropTypes.string,
  type: PropTypes.string,
  className: PropTypes.string
};
