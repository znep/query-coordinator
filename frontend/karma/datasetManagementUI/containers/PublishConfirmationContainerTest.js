import React from 'react';
import { assert } from 'chai';
import { mapStateToProps } from 'datasetManagementUI/containers/PublishConfirmationContainer';
import state from '../data/stateWithRevision';
import dotProp from 'dot-prop-immutable';

describe('containers/PublishConfirmationContainer', () => {
  const ownProps = {
    params: {
      revisionSeq: '0'
    }
  }

  before(() => {
    window.serverConfig.featureFlags.usaid_features_enabled = true;
  });

  after(() => {
    window.serverConfig.featureFlags.usaid_features_enabled = false;
  });

  it('disables the publish button if any revision updates are in progress', () => {
    const props = mapStateToProps(state, ownProps);
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

    const newProps = mapStateToProps(newState, ownProps);
    assert.isTrue(newProps.btnDisabled);
  });

  it('correctly figures out which selector is seleced from store', () => {
    const props = mapStateToProps(state, ownProps);
    assert.isTrue(props.publicSelected);
  });
});
