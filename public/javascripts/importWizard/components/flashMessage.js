import React, { PropTypes } from 'react';

function flashMessage({ flashType, message }) {

  var messageDisplay;
  if (_.isArray(message)) {
    messageDisplay =
    (<ul>
    {_.map(message, function(msg) {
      return <li>{msg}</li>;
    })}
    </ul>);
  } else {
    messageDisplay = message;
  }

  return (
    <div className={'flash-alert ' + flashType}>
      {messageDisplay}
    </div>
  );
}

flashMessage.propTypes = {
  flashType: PropTypes.string.isRequired,
  message: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.string),
    PropTypes.string
  ]).isRequired
};

export default flashMessage;
