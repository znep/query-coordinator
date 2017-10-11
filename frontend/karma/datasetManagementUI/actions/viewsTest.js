import { assert } from 'chai';
import fetchMock from 'fetch-mock';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { getView } from 'reduxStuff/actions/views';
import * as coreLinks from 'links/coreLinks';

const API_RESPONSES = {
  getView: {
    columns: [{ name: 'col1' }, { name: 'col2' }],
    displayType: 'draft'
  }
};

const FOUR_FOUR = 'abcd-1234';

const mockStore = configureStore([thunk])({});

describe('view redux actions', () => {
  before(() => {
    fetchMock.get(coreLinks.view(FOUR_FOUR), {
      body: JSON.stringify(API_RESPONSES.getView),
      status: 200,
      statusText: 'Ok'
    });
  });

  after(() => {
    fetchMock.restore();
  });

  describe('getView', () => {
    it('dispatches an EDIT_VIEW action with the correct payload', done => {
      mockStore.dispatch(getView(FOUR_FOUR)).then(() => {
        const action = mockStore.getActions().find(a => a.type === 'EDIT_VIEW');

        assert.isOk(action);
        assert.containsAllKeys(action.payload, ['columns', 'displayType']);

        done();
      });
    });
  });
});
