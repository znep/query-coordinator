import { assert } from 'chai';
import { DeleteAsset } from 'common/components/AssetBrowser/components/action_modals/delete_asset';
import mockCeteraResults from '../../data/mock_cetera_results';
import sinon from 'sinon';
import { renderComponentWithPropsAndStore } from 'common/spec/helpers';
import { useTestTranslations } from 'common/i18n';
import sharedTranslations from 'common/i18n/config/locales/en.yml';

describe('components/DeleteAsset', () => {
  beforeEach(() => {
    useTestTranslations(sharedTranslations.en);
  });

  const deleteAssetProps = (options = {}) => ({
    assetActions: {
      performingActionFailure: false,
      performingAction: false
    },
    assetType: 'dataset',
    deleteAsset: () => {},
    fetchChildAssets: () => {},
    onDismiss: () => {},
    results: mockCeteraResults,
    uid: '9xzi-4fxu',
    ...options
  });

  it('renders a modal', () => {
    const stub = sinon.stub();
    stub.resolves({ resultSetSize: 4 });

    const element = renderComponentWithPropsAndStore(DeleteAsset, deleteAssetProps({
      fetchChildAssets: stub
    }));
    assert.isNotNull(element);
    assert.equal(element.className, 'action-modal delete-asset');
  });

  it('shows a loading spinner while fetching the child assets', () => {
    const stub = sinon.stub();
    stub.resolves({ resultSetSize: 4 });

    const element = renderComponentWithPropsAndStore(DeleteAsset, deleteAssetProps({
      fetchChildAssets: stub
    }));

    assert.isNotNull(element.querySelector('.spinner-default'));
  });

  it('hides the loading spinner after fetching the child assets', (done) => {
    const stub = sinon.stub();
    stub.resolves({ resultSetSize: 4 });

    const element = renderComponentWithPropsAndStore(DeleteAsset, deleteAssetProps({
      fetchChildAssets: stub
    }));

    _.defer(() => {
      assert.isNull(element.querySelector('.spinner-default'));
      done();
    });
  });

  describe('datasets', () => {
    it('shows the number of children that will be deleted along with the dataset', (done) => {
      const stub = sinon.stub();
      stub.resolves({ resultSetSize: 55 });

      const element = renderComponentWithPropsAndStore(DeleteAsset, deleteAssetProps({
        fetchChildAssets: stub
      }));

      _.defer(() => {
        assert.equal(element.querySelector('.sub-description').textContent,
          '55 related assets built using this dataset will also be deleted permanently.');
        done();
      });
    });

    it('uses the singular term when only one related asset will be deleted', (done) => {
      const stub = sinon.stub();
      stub.resolves({ resultSetSize: 1 });

      const element = renderComponentWithPropsAndStore(DeleteAsset, deleteAssetProps({
        fetchChildAssets: stub
      }));

      _.defer(() => {
        assert.equal(element.querySelector('.sub-description').textContent,
          '1 related asset built using this dataset will also be deleted permanently.');
        done();
      });
    });

    it('quotes the name of the asset being deleted', (done) => {
      const stub = sinon.stub();
      stub.resolves({ resultSetSize: 55 });

      const element = renderComponentWithPropsAndStore(DeleteAsset, deleteAssetProps({
        fetchChildAssets: stub
      }));

      _.defer(() => {
        assert.equal(element.querySelector('.description').textContent,
          'Are you sure you want to delete "Seattle Police Department Police Report Incident"?');
        done();
      });
    });
  });

  describe('charts', () => {
    it('tells the user that the parent dataset will not be deleted', (done) => {
      const stub = sinon.stub();
      stub.resolves({ resultSetSize: 0 });

      const element = renderComponentWithPropsAndStore(DeleteAsset, deleteAssetProps({
        assetType: 'chart',
        fetchChildAssets: stub
      }));

      _.defer(() => {
        assert.equal(element.querySelector('.sub-description').textContent,
          'This is a chart based on another dataset. The related dataset will not be deleted.');
        done();
      });
    });
  });

  describe('maps', () => {
    it('tells the user that the parent dataset will not be deleted', (done) => {
      const stub = sinon.stub();
      stub.resolves({ resultSetSize: 0 });

      const element = renderComponentWithPropsAndStore(DeleteAsset, deleteAssetProps({
        assetType: 'map',
        fetchChildAssets: stub
      }));

      _.defer(() => {
        assert.equal(element.querySelector('.sub-description').textContent,
          'This is a map based on another dataset. The related dataset will not be deleted.');
        done();
      });
    });
  });
});
