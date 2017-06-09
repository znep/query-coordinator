import sinon from 'sinon';
import _ from 'lodash';
import { assert } from 'chai';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import * as Actions from 'actions/pager';
import mockCeteraResponse from 'data/mockCeteraResponse';
import ceteraUtils from 'common/cetera_utils';

const stubCeteraQuery = (ceteraResponse = mockCeteraResponse) => (
  sinon.stub(ceteraUtils, 'query').callsFake(_.constant(Promise.resolve(ceteraResponse)))
);

const mockStore = configureMockStore([ thunk ]);

let ceteraStub;

describe('actions/pager', () => {
  describe('changePage', () => {
    beforeEach(() => {
      ceteraStub = stubCeteraQuery();
    });

    afterEach(() => {
      ceteraStub.restore();
    });

    it('sets the pageNumber', () => {
      const initialState = { catalog: { pageNumber: 1 } };
      const store = mockStore(initialState);

      const expectedActions = [
        { type: 'FETCH_RESULTS' },
        { type: 'UPDATE_CATALOG_RESULTS', response: mockCeteraResponse, onlyRecentlyViewed: false },
        { type: 'FETCH_RESULTS_SUCCESS' },
        { type: 'CHANGE_PAGE', pageNumber: 4  }
      ];

      return store.dispatch(Actions.changePage(4)).then(() => {
        assert.deepEqual(store.getActions(), expectedActions);
      });
    });
  });
});
