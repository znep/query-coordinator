import React from 'react';
import { assert } from 'chai';
import { mapStateToProps } from 'datasetManagementUI/containers/PublishingContainer';

describe('containers/PublishingContainer', () => {
  const rowsToBeUpserted = 1000;

  const state = {
    ui: {},
    entities: {
      revisions: {
        0: {
          permission: 'public'
        }
      },
      task_sets: {
        0: {
          output_schema_id: 52,
          updated_at: '2017-06-19T23:45:16.306Z'
        }
      },
      output_schemas: {
        52: {
          input_schema_id: 42
        }
      },
      input_schemas: {
        42: {
          total_rows: rowsToBeUpserted
        }
      }
    }
  };

  const ownProps = {
    params: {
      fourfour: 'abcd-efgh'
    }
  };

  it('fetches the taskSet, fourFour, and rowsToBeUpserted', () => {
    const props = mapStateToProps(state, ownProps);
    assert.deepEqual(props, {
      revision: {
        permission: 'public'
      },
      taskSet: {
        output_schema_id: 52,
        updated_at: '2017-06-19T23:45:16.306Z'
      },
      fourfour: 'abcd-efgh',
      rowsToBeUpserted: 1000
    });
  });

  it('handles case where there is no output schema', () => {
    const stateWithNoFile = {
      ...state,
      entities: {
        ...state.entities,
        task_sets: {
          0: {
            updated_at: '2017-06-19T23:45:16.306Z',
            output_schema_id: null
          }
        },
        output_schemas: {},
        input_schemas: {}
      }
    };
    const props = mapStateToProps(stateWithNoFile, ownProps);
    assert.deepEqual(props, {
      rowsToBeUpserted: null,
      revision: {
        permission: 'public'
      },
      taskSet: {
        output_schema_id: null,
        updated_at: '2017-06-19T23:45:16.306Z'
      },
      fourfour: 'abcd-efgh'
    });
  });
});
