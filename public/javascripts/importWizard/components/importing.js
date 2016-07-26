import React, { PropTypes } from 'react';
import NavigationControl from './navigationControl';
import format from 'stringformat';

function renderProgressText(importStatus, operation) {
  let progressText = null;
  switch (operation) {
    case 'UploadData':
      switch (importStatus.type) {
        case 'InProgress':
          progressText = format(I18n.screens.import_pane.rows_imported_js, importStatus.progress.rowsImported);
          break;
      }
      break;

    case 'UploadGeospatial':
      switch (importStatus.type) {
        case 'InProgress':
          progressText = I18n.screens.import_pane[importStatus.progress.stage];
          break;
      }
      break;

    default:
      console.error('Invalid operation', operation);
  }

  if (progressText !== null) {
    return (
      <p className="importStatus subheadline">
        {progressText}
      </p>
    );
  }
}

function notifyMeButton(notificationStatus, operation, onNotifyMe) {
  if (_.isUndefined(notificationStatus)) {
    return;
  }

  const button = (
    <div className="notifyUploadContainer clearfix">
      <div className="notifyUploadButtonContainer">
        <a
          className="button setNotifyComplete"
          onClick={onNotifyMe}>
          {I18n.screens.dataset_new.notify_me}
        </a>
        {I18n.screens.dataset_new.notify_me_messaging}
      </div>
    </div>
  );

  // TODO: do we need to actually provide a progress spinner for this?
  // const progress = (
  //   <div className="notifyUploadContainer clearfix">
  //     <div className="notifyUploadThrobberContainer">
  //       <span className="requestingNotify"></span>
  //     </div>
  //   </div>
  // );

  const completed = (
    <div className="notifyingUploadComplete">
      <div className="messaging">
        <span className="icon-official green-check"></span>
        <span dangerouslySetInnerHTML={{__html: format(I18n.screens.dataset_new.notify_me_success_html_js, blist.currentUser.email)}} />
      </div>
      <div className="messaging sub">{I18n.screens.dataset_new.notify_me_success_addl}</div>
    </div>
  );

  const error = (
    <div className="flash error notifyUploadError" dangerouslySetInnerHTML={{__html: I18n.screens.dataset_new.notify_me_error_html}} />
  );

  switch (notificationStatus) {
    case 'Available':
      return button;
    case 'InProgress':
      return;
    case 'NotificationSuccessful':
      return completed;
    case 'NotificationError':
      return error;
    default:
      console.error('unknown notification status type', notificationStatus);
  }
}

export function view({importStatus, operation, onNotifyMe}) {
  return (
    <div>
      <div className="workingPane">
        <p className="headline">{I18n.screens.dataset_new.importing_your_data}</p>
        {renderProgressText(importStatus, operation)}
        <div className="spinner-default spinner-large-center"></div>
        <div className="notifyUploadComplete">
          {notifyMeButton(importStatus.notification, operation, onNotifyMe)}
        </div>
      </div>
      <NavigationControl />
    </div>
  );
}

view.propTypes = {
  importStatus: PropTypes.object.isRequired,
  operation: PropTypes.string.isRequired,
  onNotifyMe: PropTypes.func.isRequired
};
