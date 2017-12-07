 /* eslint-disable no-duplicate-imports */
 /* eslint-disable import/no-duplicates */

import sinon from 'sinon';
import { assert } from 'chai';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import {
  deleteAsset,
  changeVisibility,
  __RewireAPI__ as actionsAPI
} from 'common/components/AssetBrowser/actions/asset_actions';
import * as assetActions from 'common/components/AssetBrowser/actions/asset_actions';

import { mockResponse } from 'common/spec/helpers';
import { useTestTranslations } from 'common/i18n';
import sharedTranslations from 'common/i18n/config/locales/en.yml';

const mockStore = configureMockStore([thunk]);

describe('actions/assetActions', () => {
  let reloadStub;

  beforeEach(() => {
    useTestTranslations(sharedTranslations.en);

    reloadStub = sinon.stub();

    actionsAPI.__Rewire__(
      'reload',
      reloadStub
    );
  });

  afterEach(() => {
    actionsAPI.__ResetDependency__('reload');
  });

  describe('deleteAsset', () => {
    beforeEach(() => {
      sinon.stub(window, 'fetch');
    });

    afterEach(() => {
      window.fetch.restore();
    });

    it('dispatches PERFORMING_ACTION and PERFORMING_ACTION_SUCCESS on a successful delete, and reloads', () => {
      window.fetch.returns(Promise.resolve(
        mockResponse(null, 200)
      ));

      const store = mockStore();
      const expectedActions = [
        { type: assetActions.PERFORMING_ACTION, actionType: 'deleteAsset' },
        { type: assetActions.PERFORMING_ACTION_SUCCESS, actionType: 'deleteAsset' }
      ];

      return store.dispatch(deleteAsset('abcd-1234')).then(() => {
        assert.deepEqual(store.getActions(), expectedActions);
        sinon.assert.calledOnce(reloadStub);
      });
    });

    it('dispatches PERFORMING_ACTION and PERFORMING_ACTION_FAILURE on a failed delete, and does not reload', () => {
      const fakeResponse = mockResponse(null, 403);
      window.fetch.returns(Promise.resolve(fakeResponse));

      const store = mockStore();
      const expectedActions = [
        { type: assetActions.PERFORMING_ACTION, actionType: 'deleteAsset' },
        { type: assetActions.PERFORMING_ACTION_FAILURE, actionType: 'deleteAsset', response: fakeResponse }
      ];

      return store.dispatch(deleteAsset('abcd-1234')).then(() => {
        assert.deepEqual(store.getActions(), expectedActions);
        sinon.assert.notCalled(reloadStub);
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
        { type: assetActions.PERFORMING_ACTION, actionType: 'changeVisibility' },
        {
          type: assetActions.SHOW_ALERT,
          body: 'This may take a few moments to take effect.',
          title: 'Visibility changed to public.',
          time: 7000
        },
        { type: assetActions.CLOSE_MODAL },
        { type: assetActions.PERFORMING_ACTION_SUCCESS, actionType: 'changeVisibility' }
      ];

      const uid = 'abcd-1234';
      const assetType = 'dataset';
      const newVisibility = 'public.read';

      return store.dispatch(changeVisibility(uid, assetType, newVisibility)).then(() => {
        const storeActions = store.getActions();
        assert.deepEqual(storeActions, expectedActions);
      });
    });
  });

});
