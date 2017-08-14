import { assert } from 'chai';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import React from 'react';
import PublishConfirmationUSAID from 'components/PublishConfirmationUSAID/PublishConfirmationUSAID';

describe('components/PublishConfirmationUSAID', () => {
  let component;
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
    };

    component = shallow(<PublishConfirmationUSAID {...defaultProps} />);
  });

  before(() => {
    window.serverConfig.featureFlags.usaid_features_enabled = true;
  });

  after(() => {
    window.serverConfig.featureFlags.usaid_features_enabled = false;
  });

  it('renders public and private options', () => {
    assert.equal(component.find('.privacySelector').length, 2);
  });

  it('calls setPermission with right args when you click private', () => {
    component.find('.privacySelector').last().simulate('click');
    assert.isTrue(defaultProps.setPermission.calledOnce);
    assert.isTrue(defaultProps.setPermission.calledWith('private'));
  });

  it('calls setPermission with right args when you click public', () => {
    component.find('.privacySelector').first().simulate('click');
    assert.isTrue(defaultProps.setPermission.calledOnce);
    assert.isTrue(defaultProps.setPermission.calledWith('public'));
  });

  it('shows correct permissions selector as active', () => {
    component.find('.cancelButton').first().simulate('click');
    assert.isTrue(defaultProps.doCancel.calledOnce);
  });

  it('calls applyRevision callback when you click publish button', () => {
    component.find('Connect(ApiCallButton)').first().simulate('click');
    assert.isTrue(defaultProps.dispatchApplyRevision.calledOnce);
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
      <PublishConfirmationUSAID {...withoutOutputSchema} />
    );
    assert.isNotNull(theComponent);
  });
});
