import React, { PropTypes, Component } from 'react';
import _ from 'lodash';
import { connect } from 'react-redux';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import Notification from 'components/Notifications/Notification';
import { removeNotification } from 'actions/notifications';

import styles from 'styles/Notifications/DetailedNotification.scss';

// export function InnerErrorMessage({ upload, children }) {
//   const badConnectionBodyDescription = {
//     __html: I18n.progress_items.connection_error_body_description.format(
//       `<span class="filename">${upload.filename}</span>`
//     )
//   };
//
//   const badConnection = (
//     <div key={I18n.progress_items.connection_error_title}>
//       <div className={styles.msgContainer}>
//         <h6>{I18n.progress_items.connection_error_title}</h6>
//         <p dangerouslySetInnerHTML={badConnectionBodyDescription} />
//         <p>{I18n.progress_items.connection_error_body_advice}</p>
//       </div>
//       {children}
//     </div>
//   );
//
//   switch (upload.__status__.error) {
//     case 502:
//       return badConnection;
//     default:
//       return badConnection;
//   }
// }

// InnerErrorMessage.propTypes = {
//   upload: PropTypes.object.isRequired
// };

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
    const { dispatch, message, details } = this.props;
    const { detailsOpen } = this.state;
    const detailsToggle = (
      <a href="#" className={styles.detailsToggle} onClick={this.toggleDetails}>
        {detailsOpen ? I18n.progress_items.hide_details : I18n.progress_items.show_details}
      </a>
    );

    return (
      <div className={styles.container}>
        <Notification {...this.props} customStatusMessage={detailsToggle} children={message} />
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
              {details}
              <div className={styles.btnContainer}>
                <button className={styles.button} onClick={() => dispatch(removeNotification())}>
                  Dismiss
                </button>
                <a target="_blank" href="https://support.socrata.com" className={styles.contactBtn}>
                  Contact Support
                </a>
              </div>
            </div>}
        </ReactCSSTransitionGroup>
      </div>
    );
  }
}

DetailedNotification.propTypes = {
  message: PropTypes.object,
  details: PropTypes.object,
  status: PropTypes.string,
  progessBar: PropTypes.bool,
  percentCompeted: PropTypes.number,
  notification: PropTypes.object,
  dispatch: PropTypes.func.isRequired
};

export default connect()(DetailedNotification);
