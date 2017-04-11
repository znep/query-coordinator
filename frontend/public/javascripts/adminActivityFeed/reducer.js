import immutable from 'immutable';
import * as actions from './actions';

export default function(state, action) {
  switch (action.type) {
    case actions.types.setActivities:
      return state.set('activities', immutable.fromJS(action.activities));

    case actions.types.setPagination:
      return state.set('pagination', immutable.fromJS(action.pagination));

    default:
      return state;
  }
}
