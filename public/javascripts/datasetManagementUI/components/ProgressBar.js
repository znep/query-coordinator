import React, { PropTypes } from 'react';

export default function ProgressBar({ percent, ariaLabel }) {
  const labelProp = {};
  if (ariaLabel) {
    labelProp['aria-label'] = ariaLabel;
  }
  return (
    <div
      className="progress-container"
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin="0"
      aria-valuemax="100"
      {...labelProp}>
      <div className="progress-bar" style={{ width: `${percent}%` }} />
    </div>
  );
}

ProgressBar.propTypes = {
  percent: PropTypes.number.isRequired,
  ariaLabel: PropTypes.string
};
