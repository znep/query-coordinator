import React, { PropTypes } from 'react';

function flashMessage({ flashType, children }) {
  return (
    <div className={'flash-alert ' + flashType}>
      {children}
    </div>
  );
}

flashMessage.propTypes = {
  flashType: PropTypes.oneOf(['info', 'success', 'warning', 'error']).isRequired,
  children: PropTypes.oneOf([
    PropTypes.element,
    PropTypes.arrayOf(PropTypes.element)
  ]).isRequired
};

export default flashMessage;
