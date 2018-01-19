import React from 'react';
import { assert } from 'chai';
import { mapStateToProps } from 'datasetManagementUI/containers/SourceSidebarContainer';
import state from '../data/initialState';
import dotProp from 'dot-prop-immutable';

describe('containers/SourceSidebarContainer', () => {
  const ownProps = {
    params: {
      revisionSeq: '0'
    }
  };

  it('correctly identifies the current upload when there is one', () => {
    const entities = {
      revisions: {
        0: {
          id: 0,
          output_schema_id: 0,
          revision_seq: 0
        }
      },
      sources: {
        0: { id: 0 },
        1: { id: 1 }
      },
      output_schemas: {
        0: { id: 0, input_schema_id: 0 }
      },
      input_schemas: {
        0: { id: 0, source_id: 0 }
      }
    };

    const { sources } = mapStateToProps({ entities }, ownProps);

    const current = sources.find(source => source.id === 0);

    assert.isTrue(current.isCurrent);
  });

  it('returns defaults if there are no sources', () => {
    const newState = dotProp.set(state, 'entities', existing => ({
      ...existing,
      sources: {},
      output_schemas: {}
    }));
    const { sources } = mapStateToProps(newState, ownProps);
    assert.equal(sources.length, 0);
  });
});
