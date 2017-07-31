import { assert } from 'chai';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import React from 'react';
import {
  PublishConfirmationUSAID,
  mapStateToProps
} from 'components/Modals/PublishConfirmationUSAID';
import state from '../../data/stateWithRevision';
import dotProp from 'dot-prop-immutable';

describe('components/Modals/PublishConfirmationUSAID', () => {
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
    window.serverConfig.featureFlags.usaidFeaturesEnabled = true;
  });

  after(() => {
    window.serverConfig.featureFlags.usaidFeaturesEnabled = false;
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

  it('gets the latest outputSchemaId from the store', () => {
    const props = mapStateToProps(state);
    assert.equal(props.outputSchemaId, 152);
  });

  it('disables the publish button if any revision updates are in progress', () => {
    const props = mapStateToProps(state);
    assert.isFalse(props.btnDisabled);

    const newState = dotProp.set(state, 'ui.apiCalls', {
      '9c7d4786-b80c-4f28-986a-6ceb70fe3027': {
        id: '9c7d4786-b80c-4f28-986a-6ceb70fe3027',
        status: 'STATUS_CALL_IN_PROGRESS',
        operation: 'UPDATE_REVISION',
        params: {
          action: {
            permission: 'private'
          }
        },
        startedAt: new Date(1497910449811),
        succeededAt: new Date(1497910450135)
      }
    });

    const newProps = mapStateToProps(newState);
    assert.isTrue(newProps.btnDisabled);
  });

  it('correctly figures out which selector is seleced from store', () => {
    const props = mapStateToProps(state);
    assert.isTrue(props.publicSelected);
  });
});
