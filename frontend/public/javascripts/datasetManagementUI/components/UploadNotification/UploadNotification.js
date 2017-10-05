import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import Notification from 'containers/NotificationContainer';
import styles from './UploadNotification.scss';
import moment from 'moment';

const isURL = (source) => source.source_type.type === 'url';

function getAdvice(source) {
  if (isURL(source)) return I18n.notifications.connection_error_body_advice_url;
  return I18n.notifications.connection_error_body_advice_upload;
}

function getDescription(source) {
  if (isURL(source)) return I18n.notifications.connection_error_body_description_url;
  return I18n.notifications.connection_error_body_description_upload;
}

function getFailureTitle(source) {
  if (isURL(source)) return I18n.notifications.url_failed;
  return I18n.notifications.upload_failed;
}

function getProgressTitle(source) {
  if (isURL(source)) return I18n.notifications.fetching;
  return I18n.notifications.uploading;
}

function getPercentage(source) {
  if (isURL(source)) return 100;
  return source.percentCompleted;
}

const streamableContentTypes = [
  'text/csv',
  'text/tab-separated-values',
  'application/vnd.google-earth.kml+xml',
  'application/vnd.geo+json'
];

function isSourceStreamable(source) {
  // don't show a scary message until we know for sure
  if (!source.content_type) return true;
  return streamableContentTypes.indexOf(source.content_type) !== -1;
}

function getStreamyWarning(source) {
  if (!source.finished_at && !source.failed_at && !isSourceStreamable(source)) {
    return (<p className={styles.message}>
      {I18n.notifications.non_streamable_source}
    </p>);
  }
}

function failureDetailsMessage(source) {
  if (!_.isEmpty(source.failure_details) &&
      source.failure_details.message &&
      source.failure_details.message !== 'internal error'
    ) {
    return source.failure_details.message;
  }
}

const errorMessage = (source) => {
  if (failureDetailsMessage(source)) {
    return (
      <div className={styles.msgContainer}>
        {failureDetailsMessage(source)}
      </div>
    );
  }

  const badConnectionBodyDescription = {
    __html: getDescription(source).format(
      `<span class="filename">${getFilename(source)}</span>`
    )
  };

  const badConnection = (
    <div className={styles.msgContainer}>
      <h6>
        {I18n.notifications.connection_error_title}
      </h6>
      <p dangerouslySetInnerHTML={badConnectionBodyDescription} />
      <p>
        {getAdvice(source)}
      </p>
    </div>
  );

  return badConnection;
};

function getFilename(source) {
  if (source.source_type.type === 'upload') return source.source_type.filename;
  if (source.source_type.type === 'url') return source.source_type.url;
  return 'Unknown';
}

function isTooOld(ts) {
  return moment().diff(ts, 'minutes') > 1;
}

// This component is called by the NotificationList component. Its main purpose
// is to translate source-specific logic into props that the generic Notification
// component can understand.
const UploadNotification = ({ source }) => {
  let message;
  let details;
  let notificationStatus;

  if (source.failed_at) {
    message = (
      <span className={styles.message}>
        {getFailureTitle(source)}
      </span>
    );
    details = errorMessage(source);
    notificationStatus = 'error';
  } else {

    message = (
      <span className={styles.message}>
        {getProgressTitle(source)}
        <span className={styles.subMessage}>
          {getFilename(source)}
          {getStreamyWarning(source)}
        </span>
      </span>
    );
    if (source.finished_at) {
      notificationStatus = 'success';
    } else {
      notificationStatus = 'inProgress';
    }
  }

  if (notificationStatus === 'error' && isTooOld(source.failed_at)) return null;
  if (notificationStatus === 'success' && isTooOld(source.finished_at)) return null;

  return (
    <Notification
      status={notificationStatus}
      id={source.id}
      progressBar
      percentCompleted={getPercentage(source)}
      isInfinite={isURL(source)}
      message={message}>
      {details}
    </Notification>
  );
};

UploadNotification.propTypes = {
  source: PropTypes.shape({
    source_type: PropTypes.shape({})
  }).isRequired,
  showDetails: PropTypes.bool
};

export default UploadNotification;
