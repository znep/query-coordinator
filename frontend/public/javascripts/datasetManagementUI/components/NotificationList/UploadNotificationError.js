import React, { PropTypes, Component } from 'react';
import { removeNotification } from '../../actions/notifications';
import ProgressBar from '../ProgressBar';
import _ from 'lodash';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import SocrataIcon from '../../../common/components/SocrataIcon';
import styles from 'styles/NotificationList/UploadNotificationError.scss';

export function InnerErrorMessage({ upload, children }) {
  const badConnectionBodyDescription = {
    __html: I18n.progress_items.connection_error_body_description.format(
      `<span class="filename">${upload.filename}</span>`)
  };

  const badConnection = (
    <div key={I18n.progress_items.connection_error_title}>
      <div className={styles.msgContainer}>
        <h6>{I18n.progress_items.connection_error_title}</h6>
        <p dangerouslySetInnerHTML={badConnectionBodyDescription}></p>
        <p>{I18n.progress_items.connection_error_body_advice}</p>
      </div>
      {children}
    </div>
  );

  switch (upload.__status__.error) {
    case 502:
      return badConnection;
    default:
      return badConnection;
  }
}

InnerErrorMessage.propTypes = {
  upload: PropTypes.object.isRequired
};

class UploadNotificationError extends Component { //  eslint-disable-line react/prefer-es6-class
  constructor() {
    super();

    this.state = {
      detailsOpen: false
    };

    _.bindAll(this, ['toggleDetails']);
  }

  toggleDetails() {
    this.setState({
      detailsOpen: !this.state.detailsOpen
    });
  }

  render() {
    const { upload, notification, dispatch } = this.props;
    const { detailsOpen } = this.state;

    return (
      <div className={styles.notification}>
        <span className={styles.message}>{I18n.progress_items.upload_failed}</span>
        <span className={styles.errorDetails}>
          <a
            href="#"
            className={styles.detailsToggle}
            onClick={this.toggleDetails}>
              {detailsOpen ? I18n.progress_items.hide_details : I18n.progress_items.show_details}
          </a>
          <SocrataIcon name="warning" className={styles.icon} />
        </span>
        <div className={styles.progressBarContainer}>
          <ProgressBar
            percent={upload.__status__.percentCompleted || 0}
            type="error"
            className={styles.progressBar} />
        </div>
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
            <InnerErrorMessage upload={upload}>
              <div className={styles.btnContainer}>
                <button
                  className={styles.button}
                  onClick={() => dispatch(removeNotification(notification))}>
                  Dismiss
                </button>
                <a target="_blank" href="https://support.socrata.com" className={styles.contactBtn}>
                  Contact Support
                </a>
              </div>
            </InnerErrorMessage>
          }
        </ReactCSSTransitionGroup>
      </div>
    );
  }
}

UploadNotificationError.propTypes = {
  upload: PropTypes.object.isRequired,
  notification: PropTypes.object,
  dispatch: PropTypes.func.isRequired
};

export default UploadNotificationError;
