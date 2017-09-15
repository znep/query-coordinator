import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import cssModules from 'react-css-modules';
import Notification from './Notification';
import styles from './list.scss';
import NotificationPropTypes from '../PropTypes/NotificationPropTypes';

class NotificationWithDivider extends PureComponent {
  render() {
    const { notification } = this.props;

    return (
      <div>
        <div styleName="divider" />
        <Notification {...notification} />
      </div>
    );
  }
}

NotificationWithDivider.propTypes = {
  notification: PropTypes.shape(NotificationPropTypes).isRequired
};

export default cssModules(NotificationWithDivider, styles);
