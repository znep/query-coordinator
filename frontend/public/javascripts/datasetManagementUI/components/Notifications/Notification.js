import React, { PropTypes, Component } from 'react';
import _ from 'lodash';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import ProgressBar from 'components/ProgressBar';
import SocrataIcon from '../../../common/components/SocrataIcon';
import styles from 'styles/Notifications/Notification.scss';

class Notification extends Component {
  constructor() {
    super();

    this.state = {
      detailsOpen: true
    };

    _.bindAll(this, ['toggleDetails']);
  }

  toggleDetails() {
    this.setState({
      detailsOpen: !this.state.detailsOpen
    });
  }

  render() {
    const { status, progressBar, percentCompleted, message, children, removeNotification, id } = this.props;
    const { detailsOpen } = this.state;
    let classNames = [styles.notification];
    let statusIcon;
    let statusMessage;

    switch (status) {
      case 'success':
        classNames = [...classNames, styles.success].join(' ');
        statusIcon = <SocrataIcon name="check" className={styles.successIcon} />;
        statusMessage = (
          <span className={styles.successMessage}>
            {I18n.notifications.success}
          </span>
        );
        break;
      case 'inProgress':
        classNames = [...classNames, styles.inProgress].join(' ');
        statusIcon = <span className={styles.progressIcon}>{`${Math.round(percentCompleted)}%`}</span>;
        break;
      case 'error':
        classNames = [...classNames, styles.error].join(' ');
        statusIcon = <SocrataIcon name="warning" className={styles.errorIcon} />;
        statusMessage = (
          <a href="#" className={styles.detailsToggle} onClick={this.toggleDetails}>
            {detailsOpen ? I18n.notifications.hide_details : I18n.notifications.show_details}
          </a>
        );
        break;
      default:
        classNames = classNames.join(' ');
    }

    return (
      <div className={classNames}>
        <div className={styles.cf}>
          <span className={styles.messageArea}>
            {message}
          </span>
          <span className={styles.statusArea}>
            {statusMessage}
            {statusIcon}
          </span>
        </div>
        {progressBar &&
          <div className={styles.progressBarContainer}>
            <ProgressBar percent={percentCompleted || 0} type={status} className={styles.progressBar} />
          </div>}
        {children &&
          <ReactCSSTransitionGroup
            transitionName={{
              enter: styles.enter,
              enterActive: styles.enterActive,
              leave: styles.leave,
              leaveActive: styles.leaveActive
            }}
            transitionEnterTimeout={500}
            transitionLeaveTimeout={500}>
            {detailsOpen &&
              <div>
                {children}
                <div className={styles.btnContainer}>
                  <button className={styles.button} onClick={() => removeNotification(id)}>
                    Dismiss
                  </button>
                  <a target="_blank" href="https://support.socrata.com" className={styles.contactBtn}>
                    Contact Support
                  </a>
                </div>
              </div>}
          </ReactCSSTransitionGroup>}
      </div>
    );
  }
}

Notification.propTypes = {
  status: PropTypes.string.isRequired,
  progressBar: PropTypes.bool,
  percentCompleted: PropTypes.number,
  children: PropTypes.object,
  message: PropTypes.object.isRequired,
  id: PropTypes.string,
  removeNotification: PropTypes.func.isRequired
};

export default Notification;
