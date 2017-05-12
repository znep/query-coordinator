import { expect, assert } from 'chai';
import _ from 'lodash';
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';
import {
  outputColumnsWithChangedType,
  loadColumnErrors,
  addColumn,
  dropColumn
} from 'actions/showOutputSchema';
import {
  batch,
  insertSucceeded,
  insertFromServerIfNotExists,
  updateFromServer
} from 'actions/database';
import { statusSavedOnServer } from 'lib/database/statuses';
import { getStoreWithOutputSchema } from '../data/storeWithOutputSchema';
import mockAPI from '../testHelpers/mockAPI';
import initialState from '../data/baseState';
// import mockPhoenixSocket from '../testHelpers/mockPhoenixSocket';
// import { getStoreWithOneColumn } from '../data/storeWithOneColumn';
// import errorTableResponse from '../data/errorTableResponse';
// import addColumnResponse from '../data/addColumnResponse';
import { createUpload } from 'actions/manageUploads';
import { latestOutputSchema, columnsForOutputSchema } from 'selectors';

const mockStore = configureStore([thunk]);
import rootReducer from 'reducers';
import { applyMiddleware, createStore } from 'redux';
import { SocketIO, Server} from 'mock-socket';

function wsmock() {
  const mockServer = new Server('/api/publishing/v1/socket')

  mockServer.on('connection', server => {
    mockServer.emit('ok', 'connected fine')
    mockServer.emit('errors', {count: 0})
    mockServer.emit('max_ptr', {
      "seq_num":0,
      "row_offset":0,
      "end_row_offset":4999
    })
    mockServer.emit('updated', {error_count: 3})
  })

  window.DSMAPI_PHOENIX_SOCKET = {
    channel: function(name){
      const x = new SocketIO('/api/publishing/v1/socket');
      // console.log(x.join)
      x.join = function() { return this }
      x.receive = function() { return this }
      return x
    }
  }

  return mockServer
}

describe.only('actions/showOutputSchema', () => {

  describe('addColumn', () => {
    let unmock;
    let unmockWS;

    beforeEach(() => {
      unmock = mockAPI();
      unmockWS = wsmock();
    });

    afterEach(() => {
      unmock();
      unmockWS.stop();
    });

    it('constructs a new output schema, given a new column', (done) => {
      const store = createStore(rootReducer, applyMiddleware(thunk));

      let fakeStore;
      let os;
      let column

      store.dispatch(createUpload({name: 'petty_crimes.csv'}))
        .then(() => {
          const {db} = store.getState()
          os = latestOutputSchema(db);
          column = columnsForOutputSchema(db, os.id)[0];
          return store.dispatch(addColumn(os, column))
        })
        .then(() => {
          return store.getState()
        })
        .then(state => {
          fakeStore = mockStore(state);
          return fakeStore.dispatch(addColumn(os, column))
            .then(() => fakeStore.getActions())
        })
        .then(actions => {
          console.log('actions', actions)
          done()
        })
        .catch(err => {
          console.log('err', err)
          done()
        });

      // setTimeout(() => {
      //   console.log(fakeStore.getActions())
      //   done()
      // }, 100);
    });

    // it('uses the input column\'s field name in the transform even if the output column\'s field name has changed', () => {
    //   // ...than the input column's fieldname
    //   const store = getStoreWithOutputSchema();
    //
    //   store.dispatch(updateFromServer('output_columns', {
    //     id: 50,
    //     field_name: 'user_edited_this_fieldname'
    //   }));
    //
    //   const db = store.getState().db;
    //   const oldSchema = _.find(db.output_schemas, { id: 18 });
    //   const oldColumn = _.find(db.output_columns, { id: 50 });
    //   const newType = 'SoQLNumber';
    //
    //   const newOutputCols = outputColumnsWithChangedType(db, oldSchema, oldColumn, newType);
    //
    //   expect(newOutputCols).to.eql([
    //     {
    //       display_name: 'arrest',
    //       position: 0,
    //       field_name: 'user_edited_this_fieldname', // save that they modified the fieldname
    //       description: null,
    //       is_primary_key: false,
    //       transform: {
    //         transform_expr: 'to_number(arrest)' // but transform from the original
    //       }
    //     },
    //     {
    //       display_name: 'block',
    //       position: 1,
    //       field_name: 'block',
    //       description: null,
    //       is_primary_key: false,
    //       transform: {
    //         transform_expr: 'block'
    //       }
    //     }
    //   ]);
    // })

  });

  // This should be tested but for some reason the channel
  // global is getting wiped out by some other test??
  // describe('addColumn', () => {

  //   it.only('does the thing', (done) => {
  //     const unmockPhx = mockPhx({
  //       'output_schema:90': [],
  //       'row_errors:4': []
  //     }, done);

  //     const store = getStoreWithOneColumn();
  //     var db = store.getState().db;

  //     const { unmockFetch } = mockFetch({
  //       '/api/publishing/v1/upload/5/schema/4': {
  //         POST: {
  //           status: 200,
  //           response: addColumnResponse
  //         }
  //       }
  //     });
  //     const outputSchema = db.output_schemas[18];
  //     const inputColumn = db.input_columns[2];
  //     store.dispatch(addColumn(outputSchema, inputColumn));
  //     setTimeout(() => {
  //       unmockFetch();
  //       unmockPhx();
  //       db = store.getState().db;
  //       console.log("WATTTT")
  //       done();
  //     }, 0);
  //   });

  // });

});
