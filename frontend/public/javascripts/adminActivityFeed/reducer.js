import immutable from 'immutable';
import {
  START_LOADING,
  STOP_LOADING,
  SET_ACTIVITIES,
  SET_PAGINATION,
  DISMISS_ALERT,
  SET_ALERT,
  SHOW_RESTORE_MODAL,
  DISMISS_RESTORE_MODAL,
  SHOW_DETAILS_MODAL,
  DISMISS_DETAILS_MODAL,
  SET_FILTER
} from './actionTypes';

export default function(state, action) {
  switch (action.type) {
    case START_LOADING:
      return state.set('loading', true);

    case STOP_LOADING:
      return state.set('loading', false);

    case SET_ACTIVITIES:
      return state.set('activities', immutable.fromJS(action.activities));

    case SET_PAGINATION:
      return state.set('pagination', immutable.fromJS(action.pagination));

    case DISMISS_ALERT:
      return state.set('alert', null);

    case SET_ALERT:
      return state.set(
        'alert',
        immutable.fromJS({type: action.alertType, translationKey: action.translationKey, data: action.data})
      );

    case SHOW_DETAILS_MODAL:
      return state.setIn(['detailsModal'], immutable.fromJS(action.activity));

    case DISMISS_DETAILS_MODAL:
      return state.setIn(['detailsModal'], null);

    case SHOW_RESTORE_MODAL:
      return state.setIn(
        ['restoreModal'],
        immutable.fromJS({
          id: action.activity.data.entity_id,
          name: action.activity.dataset.name
        })
      );

    case DISMISS_RESTORE_MODAL:
      return state.setIn(['restoreModal'], null);

    case SET_FILTER:
      return state.
        mergeDeep(immutable.fromJS({ filter: action.filter }));

    default:
      return state;
  }
}
