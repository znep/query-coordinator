import * as Immutable from 'immutable';
import * as ReduxImmutable from 'redux-immutablejs';
import * as Actions from './actions';

const initialState = Immutable.fromJS({
  visible: false,
  hoverable: null
});

const openFeedbackFlannel = (state, { hoverable }) => state.merge({ visible: true, hoverable });

const closeFeedbackFlannel = () => initialState;

export default ReduxImmutable.createReducer(initialState, {
  [Actions.types.open]: openFeedbackFlannel,
  [Actions.types.close]: closeFeedbackFlannel
});
