import * as Immutable from 'immutable';
import * as ReduxImmutable from 'redux-immutablejs';
import * as Actions from './actions';

const initialState = new Immutable.Map;

const initialFileState = new Immutable.Map({
  inProgress: false,
  failed: false
});

const failedFileState = new Immutable.Map({
  inProgress: false,
  failed: true
});

const inProgressFileState = new Immutable.Map({
  inProgress: true,
  failed: false
});

const start = (state, { section, fileName }) =>
  state.setIn([section, fileName], inProgressFileState);

const cancel = (state, { section, fileName }) =>
  state.setIn([section, fileName], initialFileState);

const success = (state, { section, fileName }) =>
  state.setIn([section, fileName], initialFileState);

const failed = (state, { section, fileName }) =>
  state.setIn([section, fileName], failedFileState);

export default ReduxImmutable.createReducer(initialState, {
  [Actions.types.start]: start,
  [Actions.types.cancel]: cancel,
  [Actions.types.success]: success,
  [Actions.types.failed]: failed
});


