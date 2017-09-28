import sinon from 'sinon';
import { assert } from 'chai';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import * as actions from 'actions/asset_actions';
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

      return store.dispatch(actions.deleteAsset('abcd-1234')).then(() => {
        assert.deepEqual(store.getActions(), expectedActions);
      });
    });

    it('dispatches PERFORMING_ACTION and PERFORMING_ACTION_FAILURE on a failed delete', () => {
      const fakeResponse = mockResponse(null, 403);
      window.fetch.returns(Promise.resolve(fakeResponse));

      const store = mockStore();
      const expectedActions = [
        { type: 'PERFORMING_ACTION', actionType: 'deleteAsset' },
        { type: 'PERFORMING_ACTION_FAILURE', actionType: 'deleteAsset', response: fakeResponse }
      ];

      return store.dispatch(actions.deleteAsset('abcd-1234')).then(() => {
        assert.deepEqual(store.getActions(), expectedActions);
      });
    });
  });

  describe('changeVisibility', () => {
    beforeEach(() => {
      sinon.stub(window, 'fetch');
    });

    afterEach(() => {
      window.fetch.restore();
    });

    it('dispatches the correct actions on a successful visibility change', () => {
      window.fetch.returns(Promise.resolve(
        mockResponse(null, 200)
      ));

      const store = mockStore();
      const expectedActions = [
        { type: 'PERFORMING_ACTION', actionType: 'changeVisibility' },
        {
          type: 'SHOW_ALERT',
          bodyLocaleKey: 'internal_asset_manager.alert_messages.visibility_changed.body',
          titleLocaleKey: 'internal_asset_manager.alert_messages.visibility_changed.title_public',
          time: 7000
        },
        { type: 'CLOSE_MODAL' },
        { type: 'PERFORMING_ACTION_SUCCESS', actionType: 'changeVisibility' }
      ];

      const uid = 'abcd-1234';
      const assetType = 'dataset';
      const newVisibility = 'public.read';

      return store.dispatch(actions.changeVisibility(uid, assetType, newVisibility)).then(() => {
        assert.deepEqual(store.getActions(), expectedActions);
      });
    });
  });

});
