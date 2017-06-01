import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { UPLOAD_NOTIFICATION } from '../../lib/notifications';
import UploadNotification from './UploadNotification';

function Notification({ entities, notification }) {
  switch (notification.type) {
    case UPLOAD_NOTIFICATION: {
      const upload = entities.uploads[notification.uploadId];
      return <UploadNotification upload={upload} notification={notification} />;
    }

    default:
      console.error('unknown progress item type', notification);
      return null;
  }
}

Notification.propTypes = {
  notification: PropTypes.object.isRequired,
  entities: PropTypes.object.isRequired
};

const mapStateToProps = ({ entities }) => ({
  entities
});

export default connect(mapStateToProps)(Notification);
