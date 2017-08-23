import { expect, assert } from 'chai';
import _ from 'lodash';
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';
import {
  SHOW_FLASH_MESSAGE,
  HIDE_FLASH_MESSAGE,
  hideFlashMessage,
  showFlashMessage
} from 'reduxStuff/actions/flashMessage';

const mockStore = configureStore([thunk]);

describe('flashMessage actions', () => {
  const store = mockStore({})

  describe('showFlashMessage', () => {
    it('creates an action of the correct shape', done => {
      store.dispatch(showFlashMessage('success', 'Data saved successfully.', 10))

      setTimeout(() => {
        const actions = store.getActions().map(action => action.type)

        assert.deepEqual(actions, [SHOW_FLASH_MESSAGE, HIDE_FLASH_MESSAGE])
        done()
      }, 20)
    });

    it('does not dispatch a HIDE aciton if optional third parameter is absent', done => {
      store.dispatch(showFlashMessage('success', 'Data saved successfully.'))

      setTimeout(() => {
        const actions = store.getActions().filter(action => action.type)

        assert.isFalse(actions.includes(HIDE_FLASH_MESSAGE))
        done()
      }, 20)
    });
  });

  describe('hideFlashMessage', () => {
    it('creates an action of the correct shape', () => {
      const expectedShape = {
        type: HIDE_FLASH_MESSAGE
      };

      const action = hideFlashMessage();

      expect(_.isEqual(action, expectedShape)).to.eq(true);
    });
  });
});
