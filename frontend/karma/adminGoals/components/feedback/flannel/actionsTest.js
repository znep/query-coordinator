import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import Immutable from 'immutable';

import * as Actions from 'components/feedback/flannel/actions';

const mockStore = configureStore([thunk]);
const initialState = Immutable.fromJS({
  feedbackFlannel: { visible: false }
});

describe('components/feedback/flannel/actionås', () => {
  let store;

  beforeEach(() => {
    store = mockStore(initialState);
  });

  it('should dispatch open feedback flannel action with hoverable', () => {
    const returnValue = Actions.open('target');
    expect(returnValue).to.deep.eq({type: Actions.types.open, hoverable: 'target'});
  });

  it('should dispatch close feedback flannel', () => {
    const returnValue = Actions.close();
    expect(returnValue).to.deep.eq({type: Actions.types.close});
  });
});
