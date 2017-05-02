import * as Immutable from 'immutable';
import * as ReduxImmutable  from 'redux-immutablejs';
import * as Actions from '../actions/bulkEdit';
import * as SharedActions from '../../shared/actions';

const initialState = Immutable.fromJS({
  visible: false,
  goal: {},
  saveError: false,
  saveInProgress: false
});

const section = 'goals';
const modal = 'bulkEdit';

const openModal = state => state.set('visible', true);
const closeModal = () => initialState;

const setFormData = (state, { data }) => state.mergeIn(['goal'], data);

const onSaveStart = (state) => state.set('saveError', false).set('saveInProgress', true);

const onSaveError = (state) => state.set('saveError', true).set('saveInProgress', false);

const onSaveSuccess = (state) => state.set('saveInProgress', false);

export default ReduxImmutable.createReducer(initialState, {
  [Actions.types.openModal]: openModal,
  [Actions.types.closeModal]: closeModal,
  [Actions.types.setFormData]: setFormData,
  [Actions.types.saveStart]: onSaveStart,
  [Actions.types.saveError]: onSaveError,
  [Actions.types.saveSuccess]: onSaveSuccess
});
