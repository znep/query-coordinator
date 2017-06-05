import sinon from 'sinon';
import _ from 'lodash';
import { assert } from 'chai';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import * as Actions from 'actions/pager';
import mockCeteraResponse from 'data/mockCeteraResponse';
import ceteraUtils from 'common/ceteraUtils';

const stubFetch = (ceteraResponse = mockCeteraResponse) => (
  sinon.stub(ceteraUtils, 'fetch').callsFake(_.constant(Promise.resolve(ceteraResponse)))
);

const mockStore = configureMockStore([ thunk ]);

let ceteraStub;

describe('actions/pager', () => {
  describe('changePage', () => {
    beforeEach(() => {
      ceteraStub = stubFetch();
    });

    afterEach(() => {
      ceteraStub.restore();
    });

    it('sets the currentPage', () => {
      const initialState = { catalog: { currentPage: 1 } };
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
