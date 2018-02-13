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

  it('correctly gets the current permission from store', () => {
    const props = mapStateToProps(state, ownProps);
    assert.equal(props.permission, state.entities.revisions['187'].action.permission);
  });

  it('defaults to public if it cannot access the revision', () => {
    const props = mapStateToProps({entities: {}}, ownProps)
    assert.equal(props.permission, 'public');
  });
});
