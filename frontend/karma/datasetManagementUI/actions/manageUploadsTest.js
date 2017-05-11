import { expect, assert } from 'chai';
import _ from 'lodash';
import { getDefaultStore } from '../testStore';
import { createUpload } from 'actions/manageUploads';
import uploadResponse from '../data/uploadResponse';
import mockPhoenixSocket from '../testHelpers/mockPhoenixSocket';
import mockAPI from '../testHelpers/mockAPI/routes';
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';
const mockStore = configureStore([thunk]);
import * as dsmapiLinks from 'dsmapiLinks';


describe.only('actions/manageUploads', () => {

  beforeEach(done => {
    const x = mockAPI();
    console.log('hey', x)
    x()
    done();
  });

  afterEach(done => {
    done();
  });

  it('does thing', (done) => {
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
      })

    const store = mockStore({
      routing: {
        fourfour: 'tw7g-jnvn',
        outputSchemaId: 9908,
        history: [
          {
            pathname: '/dataset/lkl/tw7g-jnvn/revisions/0',
            search: '',
            hash: '',
            action: 'POP',
            key: null,
            query: {}
          },
          {
            pathname: '/dataset/lkl/tw7g-jnvn/revisions/0/uploads/8325/schemas/9649/output/9908',
            search: '',
            hash: '',
            action: 'PUSH',
            key: '0dyqa2',
            query: {}
          }
        ],
        location: {
          locationBeforeTransitions: {
            pathname: '/dataset/lkl/tw7g-jnvn/revisions/0/uploads/8325/schemas/9649/output/9908',
            search: '',
            hash: '',
            action: 'PUSH',
            key: '0dyqa2',
            query: {}
          }
        }
      }
    });

    store.dispatch(createUpload({name: 'petty_crimes.csv'}))
      .then(() => {
        console.log(store.getActions())
        done()
      })
  })
});
