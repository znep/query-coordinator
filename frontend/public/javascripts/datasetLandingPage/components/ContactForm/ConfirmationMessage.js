import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import classNames from 'classnames';

class ConfirmationMessage extends PureComponent {
  render() {
    const { success, text } = this.props;

    const alertClasses = classNames('alert', {
      success: success,
      error: !success
    });

    return (
      <section className="modal-content">
        <div className={alertClasses} dangerouslySetInnerHTML={{ __html: text }} />
      </section>
    );
  }
}

ConfirmationMessage.propTypes = {
  success: PropTypes.bool.isRequired,
  text: PropTypes.string.isRequired
};

export default ConfirmationMessage;
