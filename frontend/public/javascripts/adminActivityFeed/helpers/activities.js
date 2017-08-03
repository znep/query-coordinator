import _ from 'lodash';
import moment from 'moment';

export function getEntityType(activity) {
  const hasJsonQuery = activity.hasIn(['dataset', 'metadata', 'jsonQuery', 'where']);
  const datasetDisplayType = activity.getIn(['dataset', 'displayType']);

  if (datasetDisplayType === 'story') {
    return 'story';
  } else if (datasetDisplayType === 'chart') {
    return 'chart';
  } else if (hasJsonQuery) {
    return 'filtered_view';
  } else {
    return 'dataset';
  }
}

export function getType(activity) {
  return _.snakeCase(activity.getIn(['data', 'activity_type']));
}

export function getStatus(activity) {
  return _.snakeCase(activity.getIn(['data', 'status']));
}

export function getUrl(activity) {
  const entityType = getEntityType(activity);
  const entityId = activity.getIn(['dataset', 'id']);

  switch (entityType) {
    case 'story':
      return `/stories/s/${entityId}`;

    case 'dataset':
    case 'filtered_view':
    case 'chart':
      return `/d/${entityId}`;

    default:
      console.warning(`Unknown entity type: ${entityType}`);
      return '';
  }
}

export function isRestorable(activity) {
  return activity.get('dataset') &&
    (activity.getIn(['dataset', 'flags']) || []).indexOf('restorable') > -1 &&
    activity.getIn(['dataset', 'deleted']) &&
    activity.getIn(['data', 'first_deleted_in_list']) &&
    activity.getIn(['data', 'activity_type']) === 'Delete';
}

export function isRestored(activity) {
  return activity.getIn(['data', 'activity_type']) === 'Delete' &&
    !activity.getIn(['dataset', 'deleted']);
}

export function isRestoreExpired(activity) {
  const eventDate = moment(activity.getIn(['data', 'latest_event', 'event_time']));
  const twoWeeksAgo = moment().subtract(14, 'days');

  return eventDate.isBefore(twoWeeksAgo);
}

export function hasDetails(activity) {
  return ['SuccessWithDataErrors', 'Failure'].includes(activity.getIn(['data', 'status']));
}
