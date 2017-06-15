import sinon from 'sinon';
import { assert } from 'chai';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import * as Actions from 'actions/asset_actions';
import * as http from 'common/http';
import { mockResponse } from 'httpHelpers';

const mockStore = configureMockStore([ thunk ]);

describe('actions/assetActions', () => {

  describe('deleteAsset', () => {
    beforeEach(() => {
      sinon.stub(window, 'fetch');
      sinon.stub(http, 'reload');
    });

    afterEach(() => {
      window.fetch.restore();
      http.reload.restore();
    });

    it('dispatches PERFORMING_ACTION and PERFORMING_ACTION_SUCCESS on a successful delete', () => {
      window.fetch.returns(Promise.resolve(
        mockResponse(null, 200)
      ));

      const store = mockStore();
      const expectedActions = [
        { type: 'PERFORMING_ACTION', actionType: 'deleteAsset' },
        { type: 'PERFORMING_ACTION_SUCCESS', actionType: 'deleteAsset' }
      ];

      return store.dispatch(Actions.deleteAsset('abcd-1234')).then(() => {
        assert.deepEqual(store.getActions(), expectedActions);
      });
    });

    it('dispatches PERFORMING_ACTION and PERFORMING_ACTION_FAILURE on a failed delete', () => {
      window.fetch.returns(Promise.resolve(
        mockResponse(null, 403)
      ));

      const store = mockStore();
      const expectedActions = [
        { type: 'PERFORMING_ACTION', actionType: 'deleteAsset' },
        { type: 'PERFORMING_ACTION_FAILURE', actionType: 'deleteAsset' }
      ];

      return store.dispatch(Actions.deleteAsset('abcd-1234')).then(() => {
        assert.deepEqual(store.getActions(), expectedActions);
      });
    });
  });

});
