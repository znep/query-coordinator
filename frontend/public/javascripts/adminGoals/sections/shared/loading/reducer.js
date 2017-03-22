import * as Immutable from 'immutable';
import * as ReduxImmutable from 'redux-immutablejs';
import * as Actions from './actions';

const initialState = Immutable.fromJS({
  inProgress: false
});

const start = (state) => state.set('inProgress', true);
const stop = (state) => state.set('inProgress', false);

export default ReduxImmutable.createReducer(initialState, {
  [Actions.types.start]: start,
  [Actions.types.stop]: stop
});
