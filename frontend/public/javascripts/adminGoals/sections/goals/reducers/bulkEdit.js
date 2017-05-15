import * as Immutable from 'immutable';
import * as ReduxImmutable  from 'redux-immutablejs';
import * as Actions from '../actions/bulkEdit';

const initialState = Immutable.fromJS({
  visible: false,
  goal: {},
  publishingAction: null,
  saveStatus: {
    error: false,
    failedGoals: [],
    inProgress: false,
    taskTotalCount: 0,
    taskCompletedCount: 0
  }
});

const openModal = state => state.set('visible', true);
const closeModal = () => initialState;

const setPublishingAction = (state, { data }) => state.
  set('publishingAction', data);

const setFormData = (state, { data }) => {
  const { path, value } = data;
  return state.set(
    'goal',
    state.get('goal').setIn(path, value)
  );
};

const onSaveStart = (state, { data }) => state.
  set('saveStatus', initialState.get('saveStatus')).
  setIn(['saveStatus', 'taskTotalCount'], data).
  setIn(['saveStatus', 'inProgress'], true);

const onSaveProgressSuccess = (state) => state.
  setIn(['saveStatus', 'taskCompletedCount'], state.getIn(['saveStatus', 'taskCompletedCount']) + 1);

const onSaveProgressError = (state, { data }) => {
  const withError = state.setIn(['saveStatus', 'error'], true);
  if (data) {
    const currentCompleteCount = state.getIn(['saveStatus', 'taskCompletedCount']);
    return withError.
      setIn(['saveStatus', 'taskCompletedCount'], currentCompleteCount + 1).
      updateIn(['saveStatus', 'failedGoals'], Immutable.List(), (list) => list.push(data)); // eslint-disable-line new-cap
  } else {
    return withError;
  }
};

const onSaveFinished = (state) =>
  state.setIn(['saveStatus', 'inProgress'], false);

export default ReduxImmutable.createReducer(initialState, {
  [Actions.types.openModal]: openModal,
  [Actions.types.closeModal]: closeModal,
  [Actions.types.setPublishingAction]: setPublishingAction,
  [Actions.types.setFormData]: setFormData,
  [Actions.types.saveStart]: onSaveStart,
  [Actions.types.saveProgressSuccess]: onSaveProgressSuccess,
  [Actions.types.saveProgressError]: onSaveProgressError,
  [Actions.types.saveFinished]: onSaveFinished
});
