import { assert } from 'chai';
import { ChangeVisibility } from 'components/action_modals/change_visibility';
import mockCeteraResults from 'data/mock_cetera_results';
import sinon from 'sinon';

describe('components/ChangeVisibility', () => {
  const changeVisibilityProps = (options = {}) => ({
    assetActions: {
      performingActionFailure: false,
      performingAction: false
    },
    assetType: 'dataset',
    changeVisibility: () => {},
    fetchParentVisibility: () => {},
    onDismiss: () => {},
    results: mockCeteraResults,
    uid: 'egc4-d24i',
    ...options
  });

  it('renders a modal', () => {
    const element = renderComponentWithPropsAndStore(ChangeVisibility, changeVisibilityProps());
    assert.isNotNull(element);
    assert.equal(element.className, 'action-modal change-visibility');
  });

  it('shows a loading spinner while fetching the parent dataset visibility', () => {
    const stub = sinon.stub();
    stub.resolves({
      results: [{ metadata: { visible_to_anonymous: true } }]
    });

    const element = renderComponentWithPropsAndStore(ChangeVisibility, changeVisibilityProps({
      assetType: 'chart',
      fetchParentVisibility: stub,
      uid: 'x2u3-er7p'
    }));

    assert.isNotNull(element.querySelector('.spinner-default'));
  });

  it('hides the loading spinner after fetching the parent dataset visibility', (done) => {
    const stub = sinon.stub();
    stub.resolves({
      results: [{ metadata: { visible_to_anonymous: true } }]
    });

    const element = renderComponentWithPropsAndStore(ChangeVisibility, changeVisibilityProps({
      assetType: 'chart',
      fetchParentVisibility: stub,
      uid: 'x2u3-er7p'
    }));

    _.defer(() => {
      assert.isNull(element.querySelector('.spinner-default'));
      done();
    });
  });

  describe('for assets that are children of Open visibility datasets', () => {
    it('shows a message that you cannot change visibility', (done) => {
      const stub = sinon.stub();
      stub.resolves({
        results: [{ metadata: { visible_to_anonymous: true } }]
      });

      const element = renderComponentWithPropsAndStore(ChangeVisibility, changeVisibilityProps({
        assetType: 'chart',
        fetchParentVisibility: stub,
        uid: 'x2u3-er7p'
      }));

      _.defer(() => {
        assert.isNull(element.querySelector('.modal-content .change-visibility-options'));
        assert.equal(
          element.querySelector('.modal-content').textContent,
          'Sorry, you can not change the visibility of this asset because it is derived from a dataset that is Public.'
        );
        done();
      });
    });
  });

  describe('for assets that are children of Internal visibility datasets', () => {
    it('allows users to change visibility', (done) => {
      const stub = sinon.stub();
      stub.resolves({
        results: [{ metadata: { visible_to_anonymous: false } }]
      });

      const element = renderComponentWithPropsAndStore(ChangeVisibility, changeVisibilityProps({
        assetType: 'chart',
        fetchParentVisibility: stub,
        uid: 'x2u3-er7p'
      }));

      _.defer(() => {
        assert.isNotNull(element.querySelector('.modal-content .change-visibility-options'));
        done();
      });
    });
  });
});
