import * as Immutable from 'immutable';
import * as ReduxImmutable  from 'redux-immutablejs';
import * as Actions from '../actions/bulkEdit';
import * as SharedActions from '../../shared/actions';

const initialState = Immutable.fromJS({
  visible: false,
  goal: {},
  message: {
    visible: false,
    content: '',
    type: 'error'
  },
  saveInProgress: false
});

const section = 'goals';
const modal = 'bulkEdit';

const openModal = state => state.set('visible', true);
const closeModal = () => initialState;

const setFormData = (state, { data }) => state.mergeIn(['goal'], data);

const setModalInProgress = (state, { inProgress }) => state.set('saveInProgress', inProgress);

const showModalMessage = (state, { message, messageType }) => state.set('message', Immutable.Map({
  visible: true,
  content: message,
  type: messageType
}));

const hideModalMessage = state => state.set('message', initialState.get('message'));

export default ReduxImmutable.createReducer(initialState, {
  [Actions.types.openModal]: openModal,
  [Actions.types.closeModal]: closeModal,
  [Actions.types.setFormData]: setFormData,
  [SharedActions.types.setModalInProgress]: SharedActions.createModalHandler(section, modal, setModalInProgress),
  [SharedActions.types.showModalMessage]: SharedActions.createModalHandler(section, modal, showModalMessage),
  [SharedActions.types.hideModalMessage]: SharedActions.createModalHandler(section, modal, hideModalMessage)
});
