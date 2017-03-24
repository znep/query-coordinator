import _ from 'lodash';
import { getDefaultStore } from '../testStore';
import { createUpload } from 'actions/manageUploads';
import uploadResponse from '../data/uploadResponse';
import mockPhoenixSocket from '../testHelpers/mockPhoenixSocket';
import { mockFetch, mockXHR } from '../testHelpers/mockHTTP';

describe('actions/manageUploads', () => {

  const fetchResponses = {
    '/api/publishing/v1/revision/hehe-hehe/0/upload': {
      POST: {
        response: {
          resource: {
            id: 6,
            filename: 'crimes.csv',
            schemas: [],
          }
        }
      }
    },
    '/api/publishing/v1/upload/6': {
      GET: {
        response: {
          resource: {
            id: 6,
            filename: 'crimes.csv',
            schemas: [
              {
                id: 6,
                input_columns: [
                  {
                    id: 1000,
                    schema_id: 6,
                    position: 0,
                    field_name: 'arrest',
                    display_name: 'arrest',
                    soql_type: 'text',
                  },
                  {
                    id: 1001,
                    schema_id: 6,
                    position: 1,
                    field_name: 'block',
                    display_name: 'block',
                    soql_type: 'text',
                  }
                ],
                output_schemas: [
                  {
                    id: 7,
                    input_schema_id: 6,
                    output_columns: [
                      {
                        id: 2000,
                        schema_id: 7,
                        position: 0,
                        field_name: 'arrest',
                        display_name: 'arrest',
                        transform: {
                          id: 0,
                          output_soql_type: 'text',
                          output_column_id: 2000,
                          transform_expr: 'identity'
                        }
                      },
                      {
                        id: 2001,
                        schema_id: 7,
                        position: 1,
                        field_name: 'block',
                        display_name: 'block',
                        transform: {
                          id: 1,
                          output_soql_type: 'text',
                          output_column_id: 2001,
                          transform_expr: 'identity'
                        }
                      }
                    ]
                  }
                ]
              }
            ],
          }
        }
      }
    },
    '/api/publishing/v1/upload/6/transform/0/results?limit=200&offset=0': {
      GET: {
        response: {
          resource: [
            'some',
            'data',
            'values'
          ]
        }
      }
    },
    '/api/publishing/v1/upload/6/transform/1/results?limit=200&offset=0': {
      GET: {
        response: {
          resource: [
            'other',
            'data',
            'values'
          ]
        }
      }
    },
    '/api/update/hehe-hehe/0/schema/6/errors?limit=1&offset=0': {
      GET: {
        response: [
          {
            offset: 1,
            error: {
              wanted: 3,
              got: 2,
              type: 'too_long',
              contents: ['foo', 'bar']
            }
          }
        ]
      }
    }
  };

  it('uploads a file, polls for schema, subscribes to channels, and fetches results', (done) => {
    const store = getDefaultStore();

    // mock fetch
    const unmockXHR = mockXHR(200, uploadResponse);
    const { unmockFetch } = mockFetch(fetchResponses);
    const unmockPhx = mockPhoenixSocket({
      'transform_progress:0': [
        {
          event: 'max_ptr',
          payload: {
            seq_num: 0,
            row_offset: 0,
            end_row_offset: 4999
          }
        },
        {
          event: 'max_ptr',
          payload: {
            seq_num: 1,
            row_offset: 5000,
            end_row_offset: 9999
          }
        }
      ],
      'transform_progress:1': [
        {
          event: 'max_ptr',
          payload: {
            seq_num: 0,
            row_offset: 0,
            end_row_offset: 4999
          }
        },
        {
          event: 'max_ptr',
          payload: {
            seq_num: 0,
            row_offset: 5000,
            end_row_offset: 9999
          }
        }
      ],
      'output_schema:7': [
        {
          event: 'update',
          payload: {
            error_count: 3
          }
        }
      ],
      'row_errors:6': [
        {
          event: 'errors',
          payload: {
            errors: 1
          }
        }
      ]
    }, (e) => {
      const db = store.getState().db;
      const inputSchema = _.find(db.input_schemas, { id: 6 });
      expect(inputSchema.total_rows).to.equal(999999);
      expect(inputSchema.num_row_errors).to.equal(1);

      expect(db.row_errors).to.deep.equal({
        '6-1': {
          offset: 1,
          error: {
            wanted: 3,
            got: 2,
            type: 'too_long',
            contents: [
              'foo',
              'bar'
            ]
          },
          input_schema_id: 6,
          id: '6-1',
          __status__: {
            type: 'SAVED',
            savedAt: 'ON_SERVER'
          }
        }
      });

      const transform0 = _.find(db.transforms, { id: 0 });
      expect(transform0.contiguous_rows_processed).to.equal(9999);

      const transform1 = _.find(db.transforms, { id: 0 });
      expect(transform1.contiguous_rows_processed).to.equal(9999);

      unmockPhx();
      unmockFetch();
      unmockXHR();
      done(e);
    });

    store.dispatch(createUpload({
      name: 'crimes.csv'
    }));

  });

});
