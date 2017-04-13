import { expect, assert } from 'chai';
import * as IC from 'components/importColumns';
import * as ED from 'components/exampleData';
import * as UF from 'components/uploadFile';
import * as CD from 'components/importColumns/columnDetail';
import * as LC from 'components/importColumns/locationColumn';
import { combineReducers } from 'redux';
import * as SaveState from 'saveState';

import { withMockFetch, testThunk } from '../asyncUtils';


describe('ImportColumns component', () => {

  describe('reducer', () => {
    it(`Does nothing ${UF.FILE_UPLOAD_COMPLETE} with empty summary`, () => {
      const expected = 'original transform value!';

      const result = IC.update(expected, {
        type: UF.FILE_UPLOAD_COMPLETE,
        summary: {}
      });

      expect(result).to.equal(expected);
    });

    it(`creates the initial transform if missing ${UF.FILE_UPLOAD_COMPLETE}`, () => {
      const summary = ED.imports2ScanResponse.summary;

      const initialTranslation = IC.initialTranslation(summary);

      const result = IC.update(undefined, {
        type: UF.FILE_UPLOAD_COMPLETE,
        summary: summary
      });

      expect(result.columns).to.deep.equal(initialTranslation);
      expect(result.defaultColumns).to.deep.equal(initialTranslation);
      expect(result.numHeaders).to.deep.equal(summary.headers);
      expect(result.sample).to.deep.equal(summary.sample);
    });

    it(`handles ${IC.CHANGE_HEADER_COUNT}`, () => {
      const original = {
        untouched: 'do not touch!',
        columns: 'original columns',
        defaultColumns: 'original default columns',
        numHeaders: 1776,
        sample: 'original sample'
      };

      const minus1 = IC.update(original, {
        type: IC.CHANGE_HEADER_COUNT,
        change: -1
      });

      expect(minus1.untouched).to.deep.equal(original.untouched);
      expect(minus1.columns).to.deep.equal(original.columns);
      expect(minus1.defaultColumns).to.deep.equal(original.defaultColumns);
      expect(minus1.sample).to.deep.equal(original.sample);

      expect(minus1.numHeaders).to.deep.equal(original.numHeaders - 1);

      const plus7 = IC.update(original, {
        type: IC.CHANGE_HEADER_COUNT,
        change: 7
      });

      expect(plus7.untouched).to.deep.equal(original.untouched);
      expect(plus7.columns).to.deep.equal(original.columns);
      expect(plus7.defaultColumns).to.deep.equal(original.defaultColumns);
      expect(plus7.sample).to.deep.equal(original.sample);

      expect(plus7.numHeaders).to.deep.equal(original.numHeaders + 7);

      const zero  = IC.update(original, {
        type: IC.CHANGE_HEADER_COUNT,
        change: 0
      });

      expect(zero.untouched).to.deep.equal(original.untouched);
      expect(zero.columns).to.deep.equal(original.columns);
      expect(zero.defaultColumns).to.deep.equal(original.defaultColumns);
      expect(zero.sample).to.deep.equal(original.sample);
      expect(zero.numHeaders).to.deep.equal(original.numHeaders);
    });

    // Sub reducers are tested in columnDetail.js
    it(`handles ${IC.UPDATE_COLUMN} with ${CD.UPDATE_COLUMN_NAME}`, () => {
      const originalColumns = [
        {virginian: false, name:'Aaron Burr'},
        {virginian: false, name: 'The Ten Dollar Founding Father'},
        {virginian: true, name: 'Thomas Jefferson', home: 'Monticello'},
        {virginian: true, name: 'George Washington', home: 'Mount Vernon'}
      ];

      // What's your name, man?
      const expectedColumns = originalColumns.map( row => {
        if (row.name == 'The Ten Dollar Founding Father') {
          return { ...row, name: 'Alexander Hamilton' };
        } else {
          return row;
        }
      });

      const original = {
        untouched: 'do not touch!',
        columns: originalColumns,
        defaultColumns: 'original default columns',
        numHeaders: 42,
        sample: 'original sample'
      };

      const result  = IC.update(original, {
        type: IC.UPDATE_COLUMN,
        index: 1,
        action: {
          type: CD.UPDATE_COLUMN_NAME,
          newName: 'Alexander Hamilton'
        }
      });

      expect(result.untouched).to.deep.equal(original.untouched);
      expect(result.defaultColumns).to.deep.equal(original.defaultColumns);
      expect(result.sample).to.deep.equal(original.sample);

      // My name is Alexander Hamilton.
      expect(result.columns).to.deep.equal(expectedColumns);
    });

    it(`handles ${IC.REMOVE_COLUMN}`, () => {
      const originalColumns = [
        {virginian: false, name:'Aaron Burr'},
        {virginian: false, name: 'Alexander Hamilton'},
        {virginian: true, name: 'Thomas Jefferson', home: 'Monticello'},
        {virginian: true, name: 'George Washington', home: 'Mount Vernon'}
      ];

      const expectedColumns = originalColumns.slice(0, 1).concat(originalColumns.slice(2));

      const original = {
        untouched: 'do not touch!',
        columns: originalColumns,
        defaultColumns: 'original default columns',
        numHeaders: 42,
        sample: 'original sample'
      };

      // Ten!  Paces fire!
      const result  = IC.update(original, {
        type: IC.REMOVE_COLUMN,
        index: 1
      });

      expect(result.untouched).to.deep.equal(original.untouched);
      expect(result.defaultColumns).to.deep.equal(original.defaultColumns);
      expect(result.sample).to.deep.equal(original.sample);

      // I imagine death so much it feels more like a memory.
      expect(result.columns).to.deep.equal(expectedColumns);
    });

    it(`handles ${IC.REMOVE_COLUMN}`, () => {
      const defaultColumns = [
        {married: false, name: 'Alexander Hamilton'},
        {married: false, name: 'Elizabeth Schulyer'},
        {married: false, name: 'Angelica Schulyer'}
      ];

      const columns = [
        {married: true, name: 'Alexander Hamilton'},
        {married: true, name: 'Elizabeth Schulyer'},
        {married: false, name: 'Angelica Schulyer'}
      ];

      const original = {
        freeAdvice: 'talk less; smile more.',
        columns: columns,
        defaultColumns: defaultColumns,
        numHeaders: 1776,
        sample: 'new york city'
      };

      // Rewind...  Rewind...
      const result  = IC.update(original, {
        type: IC.RESTORE_SUGGESTED_SETTINGS
      });

      expect(result.untouched).to.deep.equal(original.untouched);
      expect(result.defaultColumns).to.deep.equal(original.defaultColumns);
      expect(result.numHeaders).to.deep.equal(original.numHeaders);
      expect(result.sample).to.deep.equal(original.sample);

      // Satisfied.
      expect(result.columns).to.deep.equal(defaultColumns);
    });

    it(`handles ${IC.ADD_COLUMN}`, () => {
      const defaultColumns = [
        {married: false, name: 'Alexander Hamilton'},
        {married: false, name: 'Elizabeth Schulyer'},
        {married: false, name: 'Angelica Schulyer'}
      ];

      const columns = [
        {married: true, name: 'Alexander Hamilton'},
        {married: true, name: 'Elizabeth Schulyer'},
        {married: false, name: 'Angelica Schulyer'}
      ];

      const original = {
        freeAdvice: 'talk less; smile more.',
        columns: columns,
        defaultColumns: defaultColumns,
        nextId: columns.length,
        numHeaders: 1776,
        sample: 'new york city'
      };

      const result  = IC.update(original, {
        type: IC.ADD_COLUMN,
        sourceColumns: ED.imports2ScanResponse.summary.columns
      });

      expect(result.columns.length).to.deep.equal(4);
      expect(_.last(result.columns)).to.deep.equal({
        id: 3,
        columnSource: {
          type: 'CompositeColumn',
          components: [],
          locationComponents: LC.emptyLocationSource(),
          sourceColumn: ED.imports2ScanResponse.summary.columns[0]
        },
        name: 'New Column 3',
        chosenType: 'text',
        transforms: []
      });
    });

    it(`handles ${IC.CLEAR_ALL_COLUMNS}`, () => {
      const defaultColumns = [
        {married: false, name: 'Alexander Hamilton'},
        {married: false, name: 'Elizabeth Schulyer'},
        {married: false, name: 'Angelica Schulyer'}
      ];

      const columns = [
        {married: true, name: 'Alexander Hamilton'},
        {married: true, name: 'Elizabeth Schulyer'},
        {married: false, name: 'Angelica Schulyer'}
      ];

      const original = {
        freeAdvice: 'talk less; smile more.',
        columns: columns,
        defaultColumns: defaultColumns,
        numHeaders: 1776,
        sample: 'new york city'
      };

      const result  = IC.update(original, {
        type: IC.CLEAR_ALL_COLUMNS
      });

      expect(result.columns).to.deep.equal([]);
    });

    it('generates the correct initial translation, given location columns', () => {
      const sourceColumns = ED.imports2ScanResponse.summary.columns.slice(0, 6);

      const summary = {
        ...ED.imports2ScanResponse.summary,
        columns: sourceColumns
      };

      const emptyLocationComponents = {
        "isMultiple": true,
        "singleSource": null,
        "street": null,
        "city": {
          "column": null,
          "text": "",
          "isColumn": true
        },
        "state": {
          "column": null,
          "text": "",
          "isColumn": true
        },
        "zip": {
          "column": null,
          "text": "",
          "isColumn": true
        },
        "latitude": null,
        "longitude": null
      };

      expect(IC.initialTranslation(summary)).to.deep.equal([
        {
          "columnSource": {
            "type": "SingleColumn",
            "sourceColumn": sourceColumns[0],
            "components": [],
            "locationComponents": emptyLocationComponents
          },
          "name": "ID",
          "chosenType": "number",
          "transforms": [],
          "id": 0
        },
        {
          "columnSource": {
            "type": "SingleColumn",
            "sourceColumn": sourceColumns[1],
            "components": [],
            "locationComponents": emptyLocationComponents
          },
          "name": "Case Number",
          "chosenType": "text",
          "transforms": [],
          "id": 1
        },
        {
          "columnSource": {
            "type": "SingleColumn",
            "sourceColumn": sourceColumns[2],
            "components": [],
            "locationComponents": emptyLocationComponents
          },
          "name": "Date",
          "chosenType": "calendar_date",
          "transforms": [],
          "id": 2
        },
        {
          "columnSource": {
            "type": "SingleColumn",
            "sourceColumn": sourceColumns[3],
            "components": [],
            "locationComponents": emptyLocationComponents
          },
          "name": "Block",
          "chosenType": "text",
          "transforms": [],
          "id": 3
        },
        {
          "columnSource": {
            "type": "SingleColumn",
            "sourceColumn": sourceColumns[4],
            "components": [],
            "locationComponents": emptyLocationComponents
          },
          "name": "IUCR",
          "chosenType": "text",
          "transforms": [],
          "id": 4
        },
        {
          "chosenType": "text",
          "columnSource": {
            "components": [],
            "locationComponents": emptyLocationComponents,
            "sourceColumn": sourceColumns[5],
            "type": "SingleColumn"
          },
          "id": 5,
          "name": "Primary Type",
          "transforms": []
        },
        {
          "columnSource": {
            "type": "LocationColumn",
            "locationComponents": {
              "isMultiple": true,
              "singleSource": null,
              "street": null,
              "city": {
                "column": null,
                "text": "",
                "isColumn": true
              },
              "state": {
                "column": null,
                "text": "",
                "isColumn": true
              },
              "zip": {
                "column": null,
                "text": "",
                "isColumn": true
              },
              "latitude": sourceColumns[0],
              "longitude": sourceColumns[1]
            },
            "sourceColumn": sourceColumns[0],
            "components": []
          },
          "id": 6,
          "name": "Location 1",
          "chosenType": "location",
          "transforms": []
        },
        {
          "columnSource": {
            "type": "LocationColumn",
            "locationComponents": {
              "isMultiple": true,
              "singleSource": null,
              "street": sourceColumns[2],
              "city": {
                "column": sourceColumns[3],
                "text": "",
                "isColumn": true
              },
              "state": {
                "column": sourceColumns[4],
                "text": "",
                "isColumn": true
              },
              "zip": {
                "column": sourceColumns[5],
                "text": "",
                "isColumn": true
              },
              "latitude": sourceColumns[0],
              "longitude": sourceColumns[1]
            },
            "sourceColumn": sourceColumns[0],
            "components": []
          },
          "id": 7,
          "name": "Location 2",
          "chosenType": "location",
          "transforms": []
        }
      ]);
    });

  });

  describe('thunks', function() {
    this.timeout(SaveState.SHOW_RESPONSE_MS + 100);

    it(`makes a call to cores importSources endpoint when the saveImportColumns thunk is dispatched`, (done) => {
      const resultColumns = [
        {
          name: 'col 1',
          columnSource: {
            type: 'SingleColumn',
            sourceColumn: {
              index: 0,
              name: 'col 1'
            }
          },
          transforms: [],
          id: 0
        },
        {
          name: 'col 2',
          columnSource: {
            type: 'SingleColumn',
            sourceColumn: {
              index: 1,
              name: 'col 2'
            }
          },
          transforms: [],
          id: 1
        }
      ];

      function identityReducer(model = null, action) { // eslint-disable-line no-unused-vars
        return model;
      }

      const mockUpdate = combineReducers({
        datasetId: identityReducer,
        lastSavedVersion: SaveState.update,
        transform: IC.update
      });

      withMockFetch(
        (url, options, resolve, reject) => {
          expect(url).to.equal('/views/abcd-efgh/import_sources');
          const requestBody = JSON.parse(options.body);

          const state = JSON.parse(requestBody.state);
          expect(state.transform).to.deep.equal({
              columns: [
                {
                  name: 'col 1',
                  columnSource: {
                    type: 'SingleColumn',
                    sourceColumn: {index: 0, name: 'col 1'}
                  },
                  transforms: [],
                  id: 0
                },
                {
                  name: 'col 2',
                  columnSource: {
                    type: 'SingleColumn',
                    sourceColumn: {index: 1, name: 'col 2'}
                  },
                  transforms: [],
                  id: 1
                }
              ]
          });
          expect(requestBody.version).to.eql(1470000000000);
          resolve({
            status: 200,
            json: () => Promise.resolve({
              importMode: 'UPLOAD_DATA',
              version: 1470979299528
            })
          });
        },
        () => {
          testThunk(
            done,
            SaveState.save(),
            {
              datasetId: 'abcd-efgh',
              lastSavedVersion: 1470000000000,
              transform: {
                columns: resultColumns
              }
            },
            mockUpdate,
            [
              (state, action) => {
                return state;
              },
              (state, action) => {
                expect(action.importSource.version).to.equal(1470979299528);
              },
              (state, action) => {
                expect(action).to.deep.equal({
                  type: SaveState.RERENDER_SAVE_BUTTON,
                });
              }
            ]
          );
        }
      )
    });

  });

});