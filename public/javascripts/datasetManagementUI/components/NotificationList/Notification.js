import _ from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import {
  UPLOAD_NOTIFICATION,
  UPSERT_JOB_NOTIFICATION
} from '../../lib/notifications';
import * as Selectors from '../../selectors';
import UploadNotification from './UploadNotification';
import UpsertJobNotification from './UpsertJobNotification';

function Notification({ db, notification }) {
  switch (notification.type) {
    case UPLOAD_NOTIFICATION: {
      const upload = _.find(db.uploads, { id: notification.uploadId });
      return <UploadNotification upload={upload} />;
    }

    case UPSERT_JOB_NOTIFICATION: {
      const upsertJob = _.find(db.upsert_jobs, { id: notification.upsertJobId });
      const props = {
        upsertJob,
        totalRows: Selectors.rowsTransformed(db, upsertJob.schema_id),
        rowsUpserted: Selectors.rowsUpserted(db, upsertJob.id)
      };
      return <UpsertJobNotification {...props} />;
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
