import { assert } from 'chai';
import sinon from 'sinon';

import reducer from 'reducer';
import * as actions from 'actions';

const INITIAL_STATE = {
  activePane: 'summary'
};

describe('Reducer', () => {
  let state;

  beforeEach(() => {
    window.initialState = _.cloneDeep(INITIAL_STATE);
    state = reducer();
  });

  afterEach(() => {
    state = undefined;
  });

  describe('SET_ACTIVE_PANE', () => {
    it('sets the active pane by name', () => {
      state = reducer(state, actions.setActivePane('metadata'));
      assert.equal(state.activePane, 'metadata');
    });
  });
});
