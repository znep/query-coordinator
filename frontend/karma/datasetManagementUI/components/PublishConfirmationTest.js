import _ from 'lodash';
import React from 'react';
import { assert } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import * as assetUtils from 'common/asset/utils';
import PublishConfirmation from 'datasetManagementUI/components/PublishConfirmation/PublishConfirmation';

describe('components/PublishConfirmation', () => {
  let component;
  let willAssetEnterApprovalsStub;
  let defaultProps;

  beforeEach(() => {
    defaultProps = {
      outputSchemaId: 174,
      btnDisabled: false,
      publicSelected: true,
      dispatchApplyRevision: sinon.spy(),
      doCancel: sinon.spy(),
      setPermission: sinon.spy(),
      params: {}
    }
  });

  before(() => {
    window.serverConfig.featureFlags.usaid_features_enabled = true;
  });

  after(() => {
    window.serverConfig.featureFlags.usaid_features_enabled = false;
  });

  describe('when assetWillEnterApprovalsQueueOnPublish is false', () => {
    beforeEach(() => {
      willAssetEnterApprovalsStub = sinon.stub(assetUtils, 'assetWillEnterApprovalsQueueOnPublish').
        returns(Promise.resolve(false));

      component = shallow(<PublishConfirmation {...defaultProps} />);
    });

    afterEach(() => {
      willAssetEnterApprovalsStub.restore();
    });

    it('renders public and private options', () => {
      assert.equal(component.find('.privacySelector').length, 2);
    });

    it('calls setCurrentPermission with right args when you click private', () => {
      component.find('.privacySelector').last().simulate('click');
      assert.equal(component.state('currentPermission'), 'private');
    });

    it('calls setCurrentPermission with right args when you click public', () => {
      component.find('.privacySelector').first().simulate('click');
      assert.equal(component.state('currentPermission'), 'public');
    });

    it('shows correct permissions selector as active', () => {
      component.find('.cancelButton').first().simulate('click');
      assert.isTrue(defaultProps.doCancel.calledOnce);
    });

    it('calls setPermission callback when you click publish button', () => {
      component.find('Connect(ApiCallButton)').first().simulate('click');
      assert.isTrue(defaultProps.setPermission.calledOnce);
      assert.isTrue(defaultProps.setPermission.calledWith(component.state('currentPermission')));
    });

    it('calls cancel callback when you click cancel button', () => {
      component.find('.cancelButton').first().simulate('click');
      assert.isTrue(defaultProps.doCancel.calledOnce);
    });

    it('renders when there is no output schema', () => {
      const withoutOutputSchema = {
        ...defaultProps,
        outputSchemaId: null
      };
      const theComponent = shallow(
        <PublishConfirmation {...withoutOutputSchema} />
      );
      assert.isNotNull(theComponent);
    });

    it('does not render an approvals queue message', () => {
      assert.lengthOf(component.find('.approvalMessage'), 0);
    });
  });

  describe('when assetWillEnterApprovalsQueueOnPublish is true', () => {
    beforeEach(() => {
      willAssetEnterApprovalsStub = sinon.stub(assetUtils, 'assetWillEnterApprovalsQueueOnPublish').
        returns(Promise.resolve(true));

      component = shallow(<PublishConfirmation {...defaultProps} />);
    });

    afterEach(() => {
      willAssetEnterApprovalsStub.restore();
    });

    it('renders an approvals queue message', (done) => {
      _.defer(() => {
        assert.lengthOf(component.find('.approvalMessage'), 1);
        done();
      });
    });
  });
});
