import React, { PropTypes, Component } from 'react';
import { removeNotification } from '../../actions/notifications';
import ProgressBar from '../ProgressBar';
import _ from 'lodash';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

export function InnerErrorMessage({ upload, children }) {
  const badConnection = (
    <div key={I18n.progress_items.connection_error_title}>
      <div className="msg-container">
        <h6>{I18n.progress_items.connection_error_title}</h6>
        <p>{I18n.progress_items.connection_error_body_description}{' '}
          <span className="filename">{upload.filename}</span>
          .
        </p>
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
      <div className="dsmui-notification error">
        <span className="message">{I18n.progress_items.upload_failed}</span>
        <span className="error-details">
          <a
            href="#"
            className="details-toggle"
            onClick={this.toggleDetails}>
              {detailsOpen ? I18n.progress_items.hide_details : I18n.progress_items.show_details}
          </a>
          <span className="icon socrata-icon-warning"></span>
        </span>
        <div className="upload-progress-bar">
          <ProgressBar percent={upload.__status__.percentCompleted || 0} />
        </div>
        <ReactCSSTransitionGroup
          transitionName="dsmui-error-notification-transition"
          transitionEnterTimeout={500}
          transitionLeaveTimeout={500}>
          {detailsOpen &&
            <InnerErrorMessage upload={upload}>
              <div className="btn-container">
                <button
                  className="btn btn-default btn-xs"
                  onClick={() => dispatch(removeNotification(notification))}>
                  Dismiss
                </button>
                <a className="btn btn-primary btn-xs" target="_blank" href="https://support.socrata.com">
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
