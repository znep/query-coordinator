import _ from 'lodash';
import React from 'react';
import { assert } from 'chai';
import { shallow } from 'enzyme';
import { ChangeVisibility } from 'common/components/AssetBrowser/components/action_modals/change_visibility';
import mockCeteraResults from '../../data/mock_cetera_results';
import sinon from 'sinon';
import { renderComponentWithPropsAndStore } from 'common/spec/helpers';

// need to `require` this file; `import` was causing the Promise stub to not have any effect
const assetUtils = require('common/asset/utils');

describe('components/ChangeVisibility', () => {
  let assetWillEnterApprovalsQueueOnPublishStub;

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

  describe('when assetWillEnterApprovalsQueueOnPublish is false', () => {

    beforeEach(() => {
      assetWillEnterApprovalsQueueOnPublishStub = sinon.stub(assetUtils,
        'assetWillEnterApprovalsQueueOnPublish').returns(Promise.resolve(false));
    });

    afterEach(() => {
      assetWillEnterApprovalsQueueOnPublishStub.restore();
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

  describe('when assetWillEnterApprovalsQueueOnPublish is true', () => {

    beforeEach(() => {
      assetWillEnterApprovalsQueueOnPublishStub = sinon.stub(assetUtils,
        'assetWillEnterApprovalsQueueOnPublish').returns(Promise.resolve(true));
    });

    afterEach(() => {
      assetWillEnterApprovalsQueueOnPublishStub.restore();
    });

    it('renders an approvals queue message', (done) => {
      const wrapper = shallow(<ChangeVisibility {...changeVisibilityProps()} />);
      _.defer(() => {
        assert.lengthOf(wrapper.find('.approval-message'), 1);
        done();
      });
    });
  });
});
