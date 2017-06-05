import React, { PropTypes, Component } from 'react';
import _ from 'lodash';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import Notification from 'components/Notification';
import ProgressBar from 'components/ProgressBar';
import { removeNotification } from 'actions/notifications';
import SocrataIcon from '../../../common/components/SocrataIcon';

import styles from 'styles/Notifications/DetailedNotification.scss';

export function InnerErrorMessage({ upload, children }) {
  const badConnectionBodyDescription = {
    __html: I18n.progress_items.connection_error_body_description.format(
      `<span class="filename">${upload.filename}</span>`
    )
  };

  const badConnection = (
    <div key={I18n.progress_items.connection_error_title}>
      <div className={styles.msgContainer}>
        <h6>{I18n.progress_items.connection_error_title}</h6>
        <p dangerouslySetInnerHTML={badConnectionBodyDescription} />
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

class DetailedNotification extends Component {
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
    const { children, dispatch } = this.props;
    const { detailsOpen } = this.state;
    const detailsToggle = (
      <a href="#" className={styles.detailsToggle} onClick={this.toggleDetails}>
        {detailsOpen ? I18n.progress_items.hide_details : I18n.progress_items.show_details}
      </a>
    );

    return (
      <div>
        <Notification {...props} customStatusMessage={detailsToggle}>
          {children}
        </Notification>
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
                <button className={styles.button} onClick={() => dispatch(removeNotification(notification))}>
                  Dismiss
                </button>
                <a target="_blank" href="https://support.socrata.com" className={styles.contactBtn}>
                  Contact Support
                </a>
              </div>
            </InnerErrorMessage>}
        </ReactCSSTransitionGroup>
      </div>
    );
  }
}

DetailedNotification.propTypes = {
  upload: PropTypes.object.isRequired,
  notification: PropTypes.object,
  dispatch: PropTypes.func.isRequired
};

export default DetailedNotification;
