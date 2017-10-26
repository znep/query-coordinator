import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';

import styles from './error-message.scss';

class ErrorMessage extends PureComponent {
  render() {
    const { text } = this.props;

    return (
      <div styleName="error-message"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: text }} />
    );
  }
}

ErrorMessage.propTypes = {
  text: PropTypes.string.isRequired
};

export default cssModules(ErrorMessage, styles);
