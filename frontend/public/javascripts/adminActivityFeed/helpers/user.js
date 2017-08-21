import {List} from 'immutable';

export function isSuperAdmin(activity) {
  return activity.
    getIn(['initiated_by', 'flags'], new List()).
    includes('admin');
}

export function getDisplayName(activity) {
  let displayName = activity.getIn(['initiated_by', 'displayName'], '');

  return displayName.length > 60 ?
    displayName.substr(0, 60) + '...' :
    displayName;
}
