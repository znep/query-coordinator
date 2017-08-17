import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import _ from 'lodash';
import styles from './alerts.scss';

const Alerts = ({ alerts }) => {
  const renderedMessages = _.map(alerts, ({ message, level }, index) => {
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
};

Alerts.propTypes = {
  alerts: PropTypes.arrayOf(
    PropTypes.shape({
      message: PropTypes.string.isRequired,
      level: PropTypes.oneOf(['notice', 'error', 'warning']).isRequired
    })
  ).isRequired
};

export default cssModules(Alerts, styles);
