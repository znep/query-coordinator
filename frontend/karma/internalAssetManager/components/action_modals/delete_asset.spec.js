import { assert } from 'chai';
import { DeleteAsset } from 'components/action_modals/delete_asset';
import mockCeteraResults from 'data/mock_cetera_results';
import sinon from 'sinon';

describe('components/DeleteAsset', () => {
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

    const element = renderComponentWithStore(DeleteAsset, deleteAssetProps({
      fetchChildAssets: stub
    }));
    assert.isNotNull(element);
    assert.equal(element.className, 'action-modal delete-asset');
  });

  it('shows a loading spinner while fetching the child assets', () => {
    const stub = sinon.stub();
    stub.resolves({ resultSetSize: 4 });

    const element = renderComponentWithStore(DeleteAsset, deleteAssetProps({
      fetchChildAssets: stub
    }));

    assert.isNotNull(element.querySelector('.spinner-default'));
  });

  it('hides the loading spinner after fetching the child assets', (done) => {
    const stub = sinon.stub();
    stub.resolves({ resultSetSize: 4 });

    const element = renderComponentWithStore(DeleteAsset, deleteAssetProps({
      fetchChildAssets: stub
    }));

    _.defer(() => {
      assert.isNull(element.querySelector('.spinner-default'));
      done();
    });
  });

  describe('datasets', () => {
    it('shows the number of children that will be deleted along with the dataset', () => {
      const stub = sinon.stub();
      stub.resolves({ resultSetSize: 55 });

      const element = renderComponentWithStore(DeleteAsset, deleteAssetProps({
        fetchChildAssets: stub
      }));

      _.defer(() => {
        assert.equal(element.querySelector('.sub-description').textContent,
          '55 related assets built using this dataset will also be deleted permanently.');
        done();
      });
    });
  });

  describe('charts', () => {
    it('tells the user that the parent dataset will not be deleted', () => {
      const stub = sinon.stub();
      stub.resolves({ resultSetSize: 0 });

      const element = renderComponentWithStore(DeleteAsset, deleteAssetProps({
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
    it('tells the user that the parent dataset will not be deleted', () => {
      const stub = sinon.stub();
      stub.resolves({ resultSetSize: 0 });

      const element = renderComponentWithStore(DeleteAsset, deleteAssetProps({
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
