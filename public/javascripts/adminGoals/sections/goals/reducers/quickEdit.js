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

export default ReduxImmutable.createReducer(new Immutable.Map, {
  [Actions.types.openModal]: openModal,
  [Actions.types.closeModal]: closeModal,
  [SharedActions.types.showModalMessage]: SharedActions.createModalHandler(section, modal, showModalMessage),
  [SharedActions.types.hideModalMessage]: SharedActions.createModalHandler(section, modal, hideModalMessage)
});
