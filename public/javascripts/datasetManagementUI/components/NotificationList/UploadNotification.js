import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import ProgressBar from '../ProgressBar';
import UploadNotificationError from './UploadNotificationError';
import { STATUS_SAVED, STATUS_UPDATE_FAILED, STATUS_FAILED_SAVED } from '../../lib/database/statuses';

function UploadNotification({ upload, notification, dispatch }) {
  if (upload.__status__.type === STATUS_SAVED) {
    return (
      <div className="dsmui-notification successful">
        <span className="message">{I18n.progress_items.uploading}</span>
        <span className="sub-message">{upload.filename}</span>
        <span className="success-message">
          {I18n.progress_items.success}&nbsp;
          <span className="socrata-icon-check" />
        </span>
        <div className="upload-progress-bar">
          <ProgressBar percent={100} />
        </div>
      </div>
    );
  } else if (upload.__status__.type === STATUS_UPDATE_FAILED ||
             upload.__status__.type === STATUS_FAILED_SAVED) {
    return <UploadNotificationError upload={upload} notification={notification} dispatch={dispatch} />;
  } else {
    return (
      <div className="dsmui-notification in-progress">
        <span className="message">{I18n.progress_items.uploading}</span>
        <span className="sub-message">{upload.filename}</span>
        <span className="percent-completed">{Math.round(upload.__status__.percentCompleted)}%</span>
        <div className="upload-progress-bar">
          <ProgressBar percent={upload.__status__.percentCompleted} />
        </div>
      </div>
    );
  }
}

UploadNotification.propTypes = {
  upload: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
  notification: PropTypes.object
};

export default connect()(UploadNotification);
