import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { UPLOAD_NOTIFICATION } from '../../lib/notifications';
import UploadNotification from './UploadNotification';

function Notification({ db, notification }) {
  switch (notification.type) {
    case UPLOAD_NOTIFICATION: {
      const upload = db.uploads[notification.uploadId];
      return <UploadNotification upload={upload} notification={notification} />;
    }

    default:
      console.error('unknown progress item type', notification);
      return null;
  }
}

Notification.propTypes = {
  notification: PropTypes.object.isRequired,
  db: PropTypes.object.isRequired
};

function mapStateToProps(state) {
  return {
    db: state.db
  };
}

export default connect(mapStateToProps)(Notification);
