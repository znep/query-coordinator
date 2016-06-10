import React, { PropTypes } from 'react';
import classNames from 'classnames';

var ConfirmationMessage = function(props) {
  var { success, text } = props;

  var alertClasses = classNames('alert', {
    success: success,
    error: !success
  });

  return (
    <section className="modal-content">
      <div className={alertClasses} dangerouslySetInnerHTML={{ __html: text }} />
    </section>
  );
};

ConfirmationMessage.propTypes = {
  success: PropTypes.bool.isRequired,
  text: PropTypes.string.isRequired
};

export default ConfirmationMessage;
