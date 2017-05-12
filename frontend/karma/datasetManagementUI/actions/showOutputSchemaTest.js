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
import mockPhoenixSocket from '../testHelpers/mockPhoenixSocket';
// import { getStoreWithOneColumn } from '../data/storeWithOneColumn';
// import errorTableResponse from '../data/errorTableResponse';
// import addColumnResponse from '../data/addColumnResponse';
import { createUpload } from 'actions/manageUploads';
import { latestOutputSchema, columnsForOutputSchema } from 'selectors';

const mockStore = configureStore([thunk]);
import rootReducer from 'reducers';
import { applyMiddleware, createStore } from 'redux';

describe.only('actions/showOutputSchema', () => {

  describe('addColumn', () => {
    let unmock;

    beforeEach(() => {
      unmock = mockAPI();
    });

    afterEach(() => {
      unmock();
    });

    it('constructs a new output schema, given a new column', (done) => {
      const store = createStore(rootReducer, applyMiddleware(thunk));

      // mockPhoenixSocket({
      //     "transform_progress:314244":[
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":0,
      //           "row_offset":0,
      //           "end_row_offset":4999
      //         }
      //       },
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":1,
      //           "row_offset":5000,
      //           "end_row_offset":9999
      //         }
      //       }
      //     ],
      //     "transform_progress:314245":[
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":0,
      //           "row_offset":0,
      //           "end_row_offset":4999
      //         }
      //       },
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":1,
      //           "row_offset":5000,
      //           "end_row_offset":9999
      //         }
      //       }
      //     ],
      //     "transform_progress:314246":[
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":0,
      //           "row_offset":0,
      //           "end_row_offset":4999
      //         }
      //       },
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":1,
      //           "row_offset":5000,
      //           "end_row_offset":9999
      //         }
      //       }
      //     ],
      //     "transform_progress:314247":[
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":0,
      //           "row_offset":0,
      //           "end_row_offset":4999
      //         }
      //       },
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":1,
      //           "row_offset":5000,
      //           "end_row_offset":9999
      //         }
      //       }
      //     ],
      //     "transform_progress:314248":[
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":0,
      //           "row_offset":0,
      //           "end_row_offset":4999
      //         }
      //       },
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":1,
      //           "row_offset":5000,
      //           "end_row_offset":9999
      //         }
      //       }
      //     ],
      //     "transform_progress:314249":[
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":0,
      //           "row_offset":0,
      //           "end_row_offset":4999
      //         }
      //       },
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":1,
      //           "row_offset":5000,
      //           "end_row_offset":9999
      //         }
      //       }
      //     ],
      //     "transform_progress:314250":[
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":0,
      //           "row_offset":0,
      //           "end_row_offset":4999
      //         }
      //       },
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":1,
      //           "row_offset":5000,
      //           "end_row_offset":9999
      //         }
      //       }
      //     ],
      //     "transform_progress:314251":[
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":0,
      //           "row_offset":0,
      //           "end_row_offset":4999
      //         }
      //       },
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":1,
      //           "row_offset":5000,
      //           "end_row_offset":9999
      //         }
      //       }
      //     ],
      //     "transform_progress:314252":[
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":0,
      //           "row_offset":0,
      //           "end_row_offset":4999
      //         }
      //       },
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":1,
      //           "row_offset":5000,
      //           "end_row_offset":9999
      //         }
      //       }
      //     ],
      //     "transform_progress:314253":[
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":0,
      //           "row_offset":0,
      //           "end_row_offset":4999
      //         }
      //       },
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":1,
      //           "row_offset":5000,
      //           "end_row_offset":9999
      //         }
      //       }
      //     ],
      //     "transform_progress:314254":[
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":0,
      //           "row_offset":0,
      //           "end_row_offset":4999
      //         }
      //       },
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":1,
      //           "row_offset":5000,
      //           "end_row_offset":9999
      //         }
      //       }
      //     ],
      //     "transform_progress:314255":[
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":0,
      //           "row_offset":0,
      //           "end_row_offset":4999
      //         }
      //       },
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":1,
      //           "row_offset":5000,
      //           "end_row_offset":9999
      //         }
      //       }
      //     ],
      //     "transform_progress:314256":[
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":0,
      //           "row_offset":0,
      //           "end_row_offset":4999
      //         }
      //       },
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":1,
      //           "row_offset":5000,
      //           "end_row_offset":9999
      //         }
      //       }
      //     ],
      //     "transform_progress:314257":[
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":0,
      //           "row_offset":0,
      //           "end_row_offset":4999
      //         }
      //       },
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":1,
      //           "row_offset":5000,
      //           "end_row_offset":9999
      //         }
      //       }
      //     ],
      //     "transform_progress:314258":[
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":0,
      //           "row_offset":0,
      //           "end_row_offset":4999
      //         }
      //       },
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":1,
      //           "row_offset":5000,
      //           "end_row_offset":9999
      //         }
      //       }
      //     ],
      //     "transform_progress:314259":[
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":0,
      //           "row_offset":0,
      //           "end_row_offset":4999
      //         }
      //       },
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":1,
      //           "row_offset":5000,
      //           "end_row_offset":9999
      //         }
      //       }
      //     ],
      //     "transform_progress:314260":[
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":0,
      //           "row_offset":0,
      //           "end_row_offset":4999
      //         }
      //       },
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":1,
      //           "row_offset":5000,
      //           "end_row_offset":9999
      //         }
      //       }
      //     ],
      //     "transform_progress:314261":[
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":0,
      //           "row_offset":0,
      //           "end_row_offset":4999
      //         }
      //       },
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":1,
      //           "row_offset":5000,
      //           "end_row_offset":9999
      //         }
      //       }
      //     ],
      //     "transform_progress:314262":[
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":0,
      //           "row_offset":0,
      //           "end_row_offset":4999
      //         }
      //       },
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":1,
      //           "row_offset":5000,
      //           "end_row_offset":9999
      //         }
      //       }
      //     ],
      //     "transform_progress:314263":[
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":0,
      //           "row_offset":0,
      //           "end_row_offset":4999
      //         }
      //       },
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":1,
      //           "row_offset":5000,
      //           "end_row_offset":9999
      //         }
      //       }
      //     ],
      //     "transform_progress:314264":[
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":0,
      //           "row_offset":0,
      //           "end_row_offset":4999
      //         }
      //       },
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":1,
      //           "row_offset":5000,
      //           "end_row_offset":9999
      //         }
      //       }
      //     ],
      //     "transform_progress:314265":[
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":0,
      //           "row_offset":0,
      //           "end_row_offset":4999
      //         }
      //       },
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":1,
      //           "row_offset":5000,
      //           "end_row_offset":9999
      //         }
      //       }
      //     ],
      //     "transform_progress:285871":[
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":0,
      //           "row_offset":0,
      //           "end_row_offset":4999
      //         }
      //       },
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":1,
      //           "row_offset":5000,
      //           "end_row_offset":9999
      //         }
      //       }
      //     ],
      //     "transform_progress:309525":[
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":0,
      //           "row_offset":0,
      //           "end_row_offset":4999
      //         }
      //       },
      //       {
      //         "event":"max_ptr",
      //         "payload":{
      //           "seq_num":1,
      //           "row_offset":5000,
      //           "end_row_offset":9999
      //         }
      //       }
      //     ],
      //   'output_schema:11197': [
      //     {
      //       event: 'update',
      //       payload: {
      //         error_count: 3
      //       }
      //     }
      //   ],
      //   'output_schema:10947': [
      //     {
      //       event: 'update',
      //       payload: {
      //         error_count: 3
      //       }
      //     }
      //   ],
      //   'row_errors:10378': [
      //     {
      //       event: 'errors',
      //       payload: {
      //         errors: 1
      //       }
      //     }
      //   ]
      // }, done)

      // const seedStore = () => (dispatch, getState) => Promise.all([
      //   createUpload({name: 'petty_crimes.csv'})
      // ])
      // const fakeStore = mockStore({})

      store.dispatch(createUpload({name: 'petty_crimes.csv'}))
        .then(() => {
          return store.getState()
        })
        .then(state => {
          const fakeStore = mockStore(state);
          const os = latestOutputSchema(state.db);
          const column = columnsForOutputSchema(state.db, os.id)[0];
          return fakeStore.dispatch(addColumn(os, column))
            .then(() => console.log(fakeStore.getActions()))
          // return fakeStore.getActions()
          // return store.getState()
          // fakeStore.dispatch(addColumn(os, column))
          //   .then(() => {
          //     console.log(fakeStore.getActions())
          //   })
        })
        .then(a => {
          console.log('hey', a)
          // return fakeStore.getActions()
        })
        .then(actions => {
          // console.log(actions)
          done()
        })
        .catch(err => {
          console.log('err', err)
          done()
        })
      // const store = getStoreWithOutputSchema();
      //
      // const db = store.getState().db;
      // const oldSchema = _.find(db.output_schemas, { id: 18 });
      // const oldColumn = _.find(db.output_columns, { id: 50 });
      // const newType = 'SoQLNumber';
      //
      // const newOutputCols = outputColumnsWithChangedType(db, oldSchema, oldColumn, newType);
      //
      // expect(newOutputCols).to.eql([
      //   {
      //     display_name: 'arrest',
      //     position: 0,
      //     field_name: 'arrest',
      //     description: null,
      //     is_primary_key: false,
      //     transform: {
      //       transform_expr: 'to_number(arrest)'
      //     }
      //   },
      //   {
      //     display_name: 'block',
      //     position: 1,
      //     field_name: 'block',
      //     description: null,
      //     is_primary_key: false,
      //     transform: {
      //       transform_expr: 'block'
      //     }
      //   }
      // ]);
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
