import { classNames } from './utils';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';

const FlashMessagePropType = PropTypes.shape({
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['notice', 'error', 'warning']).isRequired
});

class FlashMessage extends PureComponent {
  render() {
    const messages = _.map(this.props.messages, ({ message, type }, index) => {
      const className = classNames('flash', type);
      const htmlMessage = { __html: message };
      return (
        <div key={index} className={className} dangerouslySetInnerHTML={htmlMessage}></div>
      );
    });
    return (
      <div>{messages}</div>
    );
  }
}

FlashMessage.propTypes = {
  messages: PropTypes.arrayOf(FlashMessagePropType)
};

FlashMessage.defaultProps = {
  messages: []
};

export default FlashMessage;
