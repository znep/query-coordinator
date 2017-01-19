import React, { PropTypes } from 'react';

export default function ProgressBar({ percent }) {
  return (
    <div
      className="progress-container"
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin="0"
      aria-valuemax="100">
      <div className="progress-bar" style={{ width: `${percent}%` }} />
    </div>
  );
}

ProgressBar.propTypes = {
  percent: PropTypes.number.isRequired
};
