import * as Immutable from 'immutable';
import * as ReduxImmutable from 'redux-immutablejs';
import * as Actions from '../actions/quickEdit';
import * as SharedActions from '../../shared/actions';

const section = 'goals';
const modal = 'quickEdit';

const initialState = Immutable.fromJS({
  visible: false,
  goalId: null,
  saveInProgress: false,
  formData: {},
  initialFormData: null,
  message: {
    visible: false,
    content: '',
    type: 'error'
  }
});

const openModal = (state, { goalId }) => state.merge({ visible: true, goalId });
const closeModal = () => initialState;

const showModalMessage = (state, { message, messageType }) => state.mergeIn(['message'], {
  visible: true,
  content: message,
  messageType
});

const hideModalMessage = (state) => state.set('message', initialState.get('message'));

const updateFormData = (state, { data }) => {
  if (state.get('initialFormData')) {
    return state.mergeIn(['formData'], data);
  } else {
    return state.set('initialFormData', data).set('formData', data);
  }
};

export default ReduxImmutable.createReducer(initialState, {
  [Actions.types.openModal]: openModal,
  [Actions.types.closeModal]: closeModal,
  [Actions.types.updateFormData]: updateFormData,
  [SharedActions.types.showModalMessage]: SharedActions.createModalHandler(section, modal, showModalMessage),
  [SharedActions.types.hideModalMessage]: SharedActions.createModalHandler(section, modal, hideModalMessage)
});
