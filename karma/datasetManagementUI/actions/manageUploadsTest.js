import _ from 'lodash';
import { getDefaultStore } from '../testStore';
import { createUpload } from 'actions/manageUploads';
import uploadResponse from '../data/uploadResponse';

describe('actions/manageUploads', () => {

  const responses = {
    '/api/update/hehe-hehe/0/upload': {
      POST: {
        resource: {
          id: 6,
          filename: 'crimes.csv',
          schemas: [],
        }
      }
    },
    '/api/update/hehe-hehe/0/upload/6': {
      GET: {
        resource: {
          id: 6,
          filename: 'crimes.csv',
          schemas: [
            {
              id: 6,
              columns: [
                {
                  id: 1000,
                  schema_id: 6,
                  schema_column_index: 0,
                  schema_column_name: 'arrest',
                  soql_type: 'text',
                },
                {
                  id: 1001,
                  schema_id: 6,
                  schema_column_index: 1,
                  schema_column_name: 'block',
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
                      schema_column_index: 0,
                      schema_column_name: 'arrest',
                      soql_type: 'text',
                      transform_to: {
                        id: 0,
                        output_column_id: 2000,
                        transform_expr: 'identity',
                        transform_input_columns: [{
                          column_id: 1000
                        }]
                      }
                    },
                    {
                      id: 2001,
                      schema_id: 7,
                      schema_column_index: 1,
                      schema_column_name: 'block',
                      soql_type: 'text',
                      transform_to: {
                        id: 1,
                        output_column_id: 2001,
                        transform_expr: 'identity',
                        transform_input_columns: [{
                          column_id: 1001
                        }]
                      }
                    }
                  ]
                }
              ]
            }
          ],
        }
      }
    },
    '/api/update/hehe-hehe/transform/0/results?limit=200&offset=0': {
      GET: {
        resource: [
          'some',
          'data',
          'values'
        ]
      }
    },
    '/api/update/hehe-hehe/transform/1/results?limit=200&offset=0': {
      GET: {
        resource: [
          'other',
          'data',
          'values'
        ]
      }
    }
  };

  function mockFetchAndXhr(status, body) {
    const realFetch = window.fetch;
    const realXMLHttpRequest = window.XMLHttpRequest;


    window.fetch = (url, options) => {
      return new Promise((resolve) => {
        resolve({
          status: 200,
          json: () => (new Promise((resolve) => {
            resolve(responses[url][options.method || 'GET']);
          }))
        });
      });
    };
    // mock XHR (for actual upload bytes)
    window.XMLHttpRequest = function() {};
    window.XMLHttpRequest.prototype.open = function(method, url) {
      this.method = method;
      this.url = url;
      this.upload = {};
      this.headers = {};
    };
    window.XMLHttpRequest.prototype.send = function(payload) {
      this.upload.onprogress({
        loaded: 50,
        total: 100
      });

      this.status = status
      this.responseText = JSON.stringify(body);

      this.onload();
    };
    window.XMLHttpRequest.prototype.setRequestHeader = function(header, value) {
      this.headers[header] = value;
    };

    return () => {
      window.fetch = realFetch;
      window.XMLHttpRequest = realXMLHttpRequest;
    }
  }

  function mockPhx(serverEvents, outerDone) {
    const allChannels = Object.keys(serverEvents);
    var neverJoinedChannels = Object.keys(serverEvents);
    const done = _.after(allChannels.length, (e) => {
      window.DSMAPI_PHOENIX_SOCKET = null;
      outerDone(e)
    });

    setTimeout(() => {
      if(neverJoinedChannels.length > 0) {
        done(new Error(`Never joined channels ${neverJoinedChannels.join(', ')}`));
      }
    }, 1000);

    // mock socket
    const sentIndices = {};

    window.DSMAPI_PHOENIX_SOCKET = {
      channel: (channelName, joinPayload) => {
        if (!serverEvents[channelName]) {
          done(new Error(`no such mock channel: ${channelName}`));
        }
        const callbacks = {};
        const joinCallbacks = {};
        function sendMessages(idx = 0) {
          setTimeout(() => {
            const messages = serverEvents[channelName];
            if (idx < messages.length) {
              const message = messages[idx];
              const callback = callbacks[message.event];
              callback(message.payload);
              sentIndices[channelName] = idx;
              sendMessages(idx + 1);
            } else {
              function allMessagesSent([channelName, messages]) {
                return messages.length - 1 === sentIndices[channelName];
              }
              if (_.toPairs(serverEvents).every(allMessagesSent)) {
                done()
              }
            }
          }, 0);
        }
        const joinedChannel = {
          receive: (joinEvent, callback) => {
            joinCallbacks[joinEvent] = callback;
            return joinedChannel;
          }
        };
        return {
          on: (eventName, callback) => {
            callbacks[eventName] = callback;
          },
          join: () => {
            neverJoinedChannels = _.without(neverJoinedChannels, channelName);
            sendMessages();
            return joinedChannel;
          }
        };
      }
    };
  }

  it('uploads a file, polls for schema, subscribes to channels, and fetches results', (done) => {
    const store = getDefaultStore();

    // mock fetch
    const unmockFetch = mockFetchAndXhr(200, uploadResponse);
    const unmockPhx = mockPhx({
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
      ]
    }, (e) => {

      const db = store.getState().db;
      const inputSchema = _.find(db.input_schemas, { id: 4 });
      expect(inputSchema.total_rows).to.equal(999999);

      const transform0 = _.find(db.transforms, { id: 0 });
      const column0 = _.find(db.columns, { id: transform0.output_column_id });
      expect(column0.contiguous_rows_processed).to.equal(9999);

      const transform1 = _.find(db.transforms, { id: 0 });
      const column1 = _.find(db.columns, { id: transform1.output_column_id });
      expect(column1.contiguous_rows_processed).to.equal(9999);

      unmockFetch();
      done(e);
    });

    store.dispatch(createUpload({
      name: 'crimes.csv'
    }));

  });

});
