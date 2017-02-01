import React, { PropTypes } from 'react';

export default function ProgressBar({ percent, ariaLabel, ariaLabeledBy }) {
  const ariaLabelProp = {};
  if (ariaLabel) {
    ariaLabelProp['aria-label'] = ariaLabel;
  }
  if (ariaLabeledBy) {
    ariaLabelProp['aria-labelledby'] = ariaLabeledBy;
  }
  return (
    <div
      className="progress-container"
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin="0"
      aria-valuemax="100"
      {...ariaLabelProp}>
      <div className="progress-bar" style={{ width: `${percent}%` }} />
    </div>
  );
}

ProgressBar.propTypes = {
  percent: PropTypes.number.isRequired,
  ariaLabel: PropTypes.string,
  ariaLabeledBy: PropTypes.string
};
