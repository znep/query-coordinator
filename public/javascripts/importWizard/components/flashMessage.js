import React, { PropTypes } from 'react';

function flashMessage({ flashType, message }) {

  return (
    <div className={'flash-alert ' + flashType}>
      {message}
    </div>
  );
}

flashMessage.propTypes = {
  flashType: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired
};

export default flashMessage;
