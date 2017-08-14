import React from 'react';
import { assert } from 'chai';
import { mapStateToProps } from 'containers/UploadSidebarContainer';
import state from '../data/initialState';
import dotProp from 'dot-prop-immutable';

describe('containers/UploadSidebarContainer', () => {
  it('splits out a current upload when there is one', () => {
    const entities = {
      revisions: {
        0: { id: 0, output_schema_id: 0 }
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

    const { currentUpload, otherUploads } = mapStateToProps({ entities });
    assert.deepEqual(currentUpload, {
      id: 0
    });
    assert.deepEqual(otherUploads, [{ id: 1 }]);
  });

  it('returns null for current upload when there is no current one', () => {
    // rare case where there is no output_schema_id on the revision
    const entities = {
      revisions: {
        0: { id: 0, output_schema_id: null }
      },
      sources: {
        0: { id: 0 },
        1: { id: 1 }
      }
    };

    const { currentUpload, otherUploads } = mapStateToProps({ entities });
    assert.isNull(currentUpload);
    assert.deepEqual(otherUploads, [{ id: 0 }, { id: 1 }]);
  });

  it('returns defaults if there are no sources', () => {
    const newState = dotProp.set(state, 'entities', existing => ({
      ...existing,
      sources: {},
      output_schemas: {}
    }));
    const { currentUpload, otherUploads } = mapStateToProps(newState);
    assert.isNull(currentUpload);
    assert.equal(otherUploads.length, 0);
  });
});
