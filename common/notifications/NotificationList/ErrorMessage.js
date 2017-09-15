import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import cssModules from 'react-css-modules';
import styles from './list.scss';

class ErrorMessage extends PureComponent {
  render() {
    const { text } = this.props;

    return (
      <div
        className="socrata-notifications-error-message"
        styleName="error-message"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: text }} />
    );
  }
}

ErrorMessage.propTypes = {
  text: PropTypes.string.isRequired
};

export default cssModules(ErrorMessage, styles);
