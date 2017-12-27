import PropTypes from 'prop-types';
import React, { Component } from 'react';
import cssModules from 'react-css-modules';
import _ from 'lodash';
import styles from './alerts.module.scss';

class Alerts extends Component {
  render() {
    const { alerts } = this.props;
    const renderedMessages = _.map(alerts, (alert, index) => {
      if (_.isNull(alert)) {
        return null;
      }

      const { message, level } = alert;

      const styleName = `alert-${level}`;
      return (
        <div
          key={index}
          styleName={styleName}
          dangerouslySetInnerHTML={{ __html: message }} />
      );
    });
    return (
      <div>{renderedMessages}</div>
    );
  }
}

Alerts.propTypes = {
  alerts: PropTypes.arrayOf(
    PropTypes.shape({
      message: PropTypes.string.isRequired,
      level: PropTypes.oneOf(['notice', 'error', 'warning']).isRequired
    })
  ).isRequired
};

export default cssModules(Alerts, styles);
