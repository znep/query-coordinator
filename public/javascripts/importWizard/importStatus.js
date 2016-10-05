import format from 'stringformat';

declare var I18n: any;

type NotificationStatus
  = 'Available'
  | 'InProgress'
  | 'NotificationSuccessful'
  | 'NotificationError'

type ImportProgress
  = { rowsImported: number }
  | { stage: string }

type ImportStatus
  = { type: 'NotStarted' }
  | { type: 'Started' }
  | { type: 'InProgress', ticket: string, progress: ImportProgress }
  | { type: 'InProgress', ticket: string, progress: ImportProgress, notification: NotificationStatus }
  | { type: 'Error', error: string }
  | { type: 'Complete' }


export function isInProgress(importStatus) {
  return importStatus.type === 'InProgress';
}

export function isComplete(importStatus) {
  return importStatus.type === 'Complete';
}

export function hasFailed(importStatus) {
  return importStatus.type === 'Error';
}

function serverEventToImportStatus(activity, issEvent) {
  // hasFailed
  if (issEvent.status === 'Failure') {
    return {
      type: 'Error',
      error: localizeError(issEvent.info)
    };
  }

  // isInProgress
  if (issEvent.status === 'InProgress') {
    return {
      type: 'InProgress',
      ticket: activity.id,
      progress: {
        rowsImported: _.get(issEvent, 'info.rowsComplete', 0),
        stage: issEvent.event_type
      }
    };
  }

  // isComplete
  if (issEvent.status === 'Success') {
    return {
      type: 'Complete'
    };
  }

  console.error('Got an unexpected ISS event with status: ', issEvent.status);
}

/**
 * In ISS this is called `info`. it has stuff in it
 */
function localizeError(info) {
  if (info.type) {
    const underscored = _.snakeCase(info.type);
    const template = I18n.screens.admin.jobs.show_page.event_messages.failure[underscored];
    if (template) {
      return format(template.description.replace(/%{/g, '{'), info);
    }
  }
  return info.message;
}

export function initialImportStatus(issActivities): ImportStatus {
  const hasActivities = issActivities && issActivities.length;
  if (!hasActivities) {
    return {
      type: 'NotStarted'
    };
  }

  const activity = _.first(issActivities);
  if (activity && activity.latest_event) {
    const event = activity.latest_event;
    return serverEventToImportStatus(activity, event);
  }

  // Due to the async-ness, the activity might be in progress but
  // no events have been a) sent b) received c) inserted.
  // If one of those things hasn't happened, the activity
  // could be in progress but the event set will be {}
  if (activity && activity.status === 'InProgress') {
    return {
      type: activity.status,
      ticket: activity.id,
      progress: {
        rowsImported: 0,
        stage: 'row-progress'
      }
    };
  }
}
