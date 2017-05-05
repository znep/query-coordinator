import * as Immutable from 'immutable';
import * as ReduxImmutable from 'redux-immutablejs';
import * as Actions from '../actions/quickEdit';

const initialState = Immutable.fromJS({
  visible: false,
  goalId: null,
  saveInProgress: false,
  formData: {},
  initialFormData: null,
  saveError: null
});

const openModal = (state, { goalId }) => state.merge({ visible: true, goalId });
const closeModal = () => initialState;

const updateFormData = (state, { data }) => {
  if (state.get('initialFormData')) {
    return state.mergeIn(['formData'], data);
  } else {
    return state.set('initialFormData', data).set('formData', data);
  }
};

const onSaveStart = (state) => state.set('saveError', null).set('saveInProgress', true);

const onSaveError = (state, { data }) => state.set('saveError', data).set('saveInProgress', false);

const onSaveSuccess = (state) => state.set('saveInProgress', false);

export default ReduxImmutable.createReducer(initialState, {
  [Actions.types.openModal]: openModal,
  [Actions.types.closeModal]: closeModal,
  [Actions.types.updateFormData]: updateFormData,
  [Actions.types.saveStart]: onSaveStart,
  [Actions.types.saveError]: onSaveError,
  [Actions.types.saveSuccess]: onSaveSuccess
});
