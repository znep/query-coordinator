import { classNames } from './utils';
import React, { PropTypes } from 'react';

const FlashMessagePropType = PropTypes.shape({
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['notice', 'error', 'warning']).isRequired
});

const FlashMessage = React.createClass({
  propTypes: {
    messages: PropTypes.arrayOf(FlashMessagePropType)
  },
  getDefaultProps() {
    return {
      messages: []
    };
  },
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
});

export default FlashMessage;
