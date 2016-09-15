import {
  updateNavigation,
  chooseOperation,
  goToPage,
  goToPrevious,
  initialNewDatasetModel
} from 'wizard';
import { fileUploadComplete } from 'components/uploadFile';
import * as SaveState from 'saveState';
import { withMockFetch, testThunk } from '../asyncUtils';

// Strips out some hidden properties?
function normalize(obj) {
  return JSON.parse(JSON.stringify(obj));
}

describe('updateNavigation', function() {
  this.timeout(100);

  const initialState = {
    operation: null,
    page: 'SelectType',
    path: []
  };

  function testChooseOperation(done, operation, navigationStateAfter) {
    withMockFetch(
      (url, options, resolve) => {
        resolve({
          status: 200,
          json: () => Promise.resolve({
            importMode: operation,
            version: 1470979299528
          })
        });
      },
      () => {
        testThunk(
          done,
          chooseOperation(operation),
          {
            lastSavedVersion: 1470000000000,
            navigation: initialState
          },
          [
            (state, action) => {
              expect(action).to.deep.equal({
                type: 'CHOOSE_OPERATION',
                name: operation
              });
              const newState = {
                navigation: updateNavigation(state.navigation, action)
              };
              expect(newState.navigation).to.deep.equal(navigationStateAfter);
              return newState;
            },
            (state, action) => {
              expect(action).to.deep.equal({
                type: SaveState.STATE_SAVED,
                importSource: {
                  importMode: operation,
                  version: 1470979299528
                }
              });
              expect(SaveState.update(state.lastSavedVersion, action)).to.equal(1470979299528);
            }
          ]
        );
      }
    );
  }

  it('sets currentPage to SelectUploadType when you choose UPLOAD_DATA', (done) => {
    testChooseOperation(done, 'UPLOAD_DATA', {
      operation: 'UPLOAD_DATA',
      page: 'SelectUploadType',
      path: [ ...initialState.path, initialState.page ]
    });
  });

  it('sets currentPage to UploadFile when you choose UPLOAD_BLOB', (done) => {
    testChooseOperation(done, 'UPLOAD_BLOB', {
      operation: 'UPLOAD_BLOB',
      page: 'UploadFile',
      path: [ ...initialState.path, initialState.page ]
    });
  });

  it('sets currentPage to UploadFile when you choose UPLOAD_GEO', (done) => {
    testChooseOperation(done, 'UPLOAD_GEO', {
      operation: 'UPLOAD_GEO',
      page: 'UploadFile',
      path: [ ...initialState.path, initialState.page ]
    });
  });

  it('sets currentPage to Metadata when you choose CONNECT_TO_ESRI', (done) => {
    testChooseOperation(done, 'CONNECT_TO_ESRI', {
      operation: 'CONNECT_TO_ESRI',
      page: 'ConnectToEsri',
      path: [ ...initialState.path, initialState.page ]
    });
  });

  it('sets currentPage to Metadata when you choose LINK_EXTERNAL', (done) => {
    testChooseOperation(done, 'LINK_EXTERNAL', {
      operation: 'LINK_EXTERNAL',
      page: 'Metadata',
      path: [ ...initialState.path, initialState.page ]
    });
  });

  it('sets currentPage to Metadata when you choose CREATE_FROM_SCRATCH', (done) => {
    testChooseOperation(done, 'CREATE_FROM_SCRATCH', {
      operation: 'CREATE_FROM_SCRATCH',
      page: 'Metadata',
      path: [ ...initialState.path, initialState.page ]
    });
  });

  it('goes to Metadata when a blob upload completes', () => {
    const stateBefore = {
      operation: 'UPLOAD_BLOB',
      page: 'UploadFile',
      path: [ 'SelectType' ]
    };
    const stateAfter = updateNavigation(
      stateBefore,
      fileUploadComplete(
        'random-file-id',
        {},
        1222345
      )
    );
    expect(stateAfter).to.deep.equal({
      ...stateBefore,
      page: 'Metadata',
      path: [ ...stateBefore.path, stateBefore.page ]
    });
  });

  it('goes to ImportShapefile when a shapefile upload completes', () => {
    const stateBefore = {
      operation: 'UPLOAD_GEO',
      page: 'UploadFile',
      path: [ 'SelectType' ]
    };
    const stateAfter = updateNavigation(
      stateBefore,
      fileUploadComplete(
        'random-file-id',
        {
          layers: [
            { name: 'districts', referenceSystem: 'NAD_1983_Michigan_GeoRef_Meters' }
          ]
        }
      )
    );
    expect(stateAfter).to.deep.equal({
      ...stateBefore,
      page: 'ImportShapefile',
      path: [ ...stateBefore.path, stateBefore.page ]
    });
  });

  it('goes to Metadata when next is called in ImportShapefile', () => {
    const stateBefore = {
      operation: 'UPLOAD_GEO',
      page: 'ImportShapefile',
      path: [ 'SelectType', 'UploadFile' ]
    };
    const stateAfter = updateNavigation(
      stateBefore,
      goToPage('Metadata')
    );
    expect(stateAfter).to.deep.equal({
      ...stateBefore,
      page: 'Metadata',
      path: [ ...stateBefore.path, stateBefore.page ]
    });
  });

  it('goes to previous page based on whatever is in the path', () => {
    const stateBefore = {
      page: 'Some Random Page',
      path: [ 'A', 'B', 'C', 'D' ]
    };
    expect(updateNavigation(stateBefore, goToPrevious())).to.deep.equal({
      page: 'D',
      path: [ 'A', 'B', 'C' ]
    });
  });
});

describe('initialNewDatasetModel', () => {

  // would be dumped onto the page by Rails
  const theView = {
    id: 'abcd-efgh',
    displayType: 'draft',
    name: 'foo'
  };

  const initialState = {
    datasetId: 'abcd-efgh',
    lastSavedVersion: null,
    connectToEsri: {},
    navigation: {
      page: 'SelectType',
      path: [],
      operation: null
    },
    upload: {},
    download: {},
    transform: null,
    layers: null,
    metadata: {
      nextClicked: false,
      apiCall: {
        type: 'Not Started'
      },
      contents: {
        name: 'foo',
        displayType: 'draft',
        href: '',
        description: '',
        category: '',
        tags: [],
        rowLabel: 'Row',
        mapLayer: '',
        customMetadata: {
          first: [
            {
              field: '1',
              value: 'ant',
              privateField: false
            },
            {
              field: '2',
              value: '',
              privateField: true
            },
            {
              field: '3',
              value: '',
              privateField: false
            }
          ],
          second: [
            {
              field: 'mars',
              value: '',
              privateField: false
            },
            {
              field: 'venus',
              value: '',
              privateField: false
            },
            {
              field: 'neptune',
              value: '50',
              privateField: false
            },
            {
              field: 'jupiter',
              value: '',
              privateField: false
            }
          ]
        },
        contactEmail: '',
        privacySettings: 'private'
      },
      license: {
        licenseName: '',
        licensing: '',
        licenseId: '',
        attribution: '',
        sourceLink: ''
      },
      lastSaved: {
        lastSavedContents: {
          name: 'foo',
          displayType: 'draft',
          href: '',
          description: '',
          category: '',
          tags: [],
          rowLabel: 'Row',
          mapLayer: '',
          customMetadata: {
            first: [
              {
                field: '1',
                value: 'ant',
                privateField: false
              },
              {
                field: '2',
                value: '',
                privateField: true
              },
              {
                field: '3',
                value: '',
                privateField: false
              }
            ],
            second: [
              {
                field: 'mars',
                value: '',
                privateField: false
              },
              {
                field: 'venus',
                value: '',
                privateField: false
              },
              {
                field: 'neptune',
                value: '50',
                privateField: false
              },
              {
                field: 'jupiter',
                value: '',
                privateField: false
              }
            ]
          },
          contactEmail: '',
          privacySettings: 'private'
        },
        lastSavedLicense: {
          licenseName: '',
          licensing: '',
          licenseId: '',
          attribution: '',
          sourceLink: ''
        }
      }
    },
    importStatus: {
      type: 'NotStarted'
    }
  };

  it('returns an initial state when `importSource` is null', () => {
    const actual = initialNewDatasetModel(theView, null);
    expect(initialState).to.deep.equal(actual);
  });

  describe('when the `importSource` has an `operation` of `CREATE_FROM_SCRATCH`', () => {

    it('returns the initial state, with navigation set correctly', () => {
      // this test is almost exactly the same as the implementation...?
      const expected = initialNewDatasetModel(theView, { version: 2, importMode: 'CREATE_FROM_SCRATCH' });
      const actual = {
        ...initialState,
        lastSavedVersion: 2,
        navigation: {
          operation: 'CREATE_FROM_SCRATCH',
          page: 'Metadata',
          path: ['SelectType']
        }
      };
      expect(expected).to.deep.equal(actual);
    });

  });

  describe('when the `importSource` has an `operation` of `UPLOAD_BLOB`', () => {

    it('sets the current page to UploadFile when there is no file', () => {
      const expected = initialNewDatasetModel(theView, { version: 2, importMode: 'UPLOAD_BLOB' });
      const actual = {
        ...initialState,
        lastSavedVersion: 2,
        navigation: {
          operation: 'UPLOAD_BLOB',
          page: 'UploadFile',
          path: ['SelectType']
        }
      };
      expect(expected).to.deep.equal(actual);
    });

    it('sets the current page to Metadata when there is file information', () => {
      const expected = initialNewDatasetModel(theView, { version: 2, importMode: 'UPLOAD_BLOB', fileId: 4490, fileName: 'name'});
      const actual = {
        ...initialState,
        lastSavedVersion: 2,
        navigation: {
          operation: 'UPLOAD_BLOB',
          page: 'Metadata',
          path: ['SelectType', 'UploadFile']
        },
        upload: {
          fileName: 'name',
          progress: {
            type: 'Complete',
            fileId: 4490
          }
        }
      };
      expect(expected).to.deep.equal(actual);
    });

  });

  describe('when the `importSource` has an `operation` of `UPLOAD_GEO`', () => {

    it('sets the current page to UploadFile when there is no file', () => {
      const expected = initialNewDatasetModel(theView, { version: 2, importMode: 'UPLOAD_GEO' });
      const actual = {
        ...initialState,
        lastSavedVersion: 2,
        navigation: {
          operation: 'UPLOAD_GEO',
          page: 'UploadFile',
          path: ['SelectType']
        }
      };
      expect(expected).to.deep.equal(actual);
    });

    it('sets the current page to ImportShapefile when there is file information, and handles missing layers field', () => {
      const expected = initialNewDatasetModel(theView, { version: 2, importMode: 'UPLOAD_GEO', scanResults: {}, fileId: 4490, fileName: 'name'});
      const actual = {
        ...initialState,
        lastSavedVersion: 2,
        navigation: {
          operation: 'UPLOAD_GEO',
          page: 'ImportShapefile',
          path: ['SelectType', 'UploadFile']
        },
        upload: {
          fileName: 'name',
          progress: {
            type: 'Complete',
            fileId: 4490,
            summary: {}
          }
        },
        layers: [],
        transform: null
      };
      expect(expected).to.deep.equal(actual);
    });

    it('sets the current page to ImportShapefile when there is file information, and handles layer info', () => {
      const expected = initialNewDatasetModel(theView, { version: 2, importMode: 'UPLOAD_GEO', scanResults: {layers: ['layer_1']}, fileId: 4490, fileName: 'name'});
      const actual = {
        ...initialState,
        lastSavedVersion: 2,
        navigation: {
          operation: 'UPLOAD_GEO',
          page: 'ImportShapefile',
          path: ['SelectType', 'UploadFile']
        },
        upload: {
          fileName: 'name',
          progress: {
            type: 'Complete',
            fileId: 4490,
            summary: {layers: ['layer_1']}
          }
        },
        layers: ['layer_1'],
        transform: null
      };
      expect(expected).to.deep.equal(actual);
    });
  });

  describe('when the `importSource` has an `operation` of `LINK_EXTERNAL`', () => {
    it('rehydrates properly', () => {
      const expected = initialNewDatasetModel(theView, { version: 2, importMode: 'LINK_EXTERNAL' });
      const actual = {
        ...initialState,
        lastSavedVersion: 2,
        navigation: {
          operation: 'LINK_EXTERNAL',
          page: 'Metadata',
          path: ['SelectType']
        }
      };
      expect(expected).to.deep.equal(actual);
    });
  });

  describe('when the `importSource` has an `operation` of `UPLOAD_DATA`', () => {

    it('initializes lastSavedVersion and navigation', () => {
      const actual = initialNewDatasetModel(theView, { version: 2, importMode: 'UPLOAD_DATA' });
      expect(actual).to.deep.equal({
        ...initialState,
        lastSavedVersion: 2,
        navigation: {
          operation: 'UPLOAD_DATA',
          page: 'SelectUploadType',
          path: ['SelectType']
        }
      });
    });

    const summary = {
      headers: 0,
      columns: [
        {
          name: 'col 1',
          index: 0
        },
        {
          name: 'col 2',
          index: 1
        }
      ],
      locations: [],
      sample: [
        ['col 1', 'col 2'],
        ['foo', 'bar'],
        ['baz', 'bin']
      ]
    };

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

    const initialStateWithTransform = {
      ...initialState,
      lastSavedVersion: 2,
      navigation: {
        operation: 'UPLOAD_DATA',
        page: 'ImportColumns',
        path: ['SelectType', 'SelectUploadType', 'UploadFile']
      },
      upload: {
        fileName: 'myfile.csv',
        progress: {
          type: 'Complete',
          fileId: '123-abc',
          summary: summary
        }
      },
      transform: {
        defaultColumns: resultColumns,
        columns: resultColumns,
        numHeaders: 0,
        sample: summary.sample
      }
    };

    it('initializes lastSavedVersion, navigation, upload, and transform when `importSource` has scan results, and goes to ImportColumns page', () => {
      const importSource = {
        version: 2,
        importMode: 'UPLOAD_DATA',
        fileName: 'myfile.csv',
        fileId: '123-abc',
        scanResults: summary
      };
      const actual = initialNewDatasetModel(theView, importSource);
      expect(normalize(initialStateWithTransform)).to.deep.equal(normalize(actual));
      // ;_; no idea why this doesn't work without the parse/stringify pairs
    });

    it('initializes the transform based on the ImportSource', () => {
      const modifiedResultColumns = [
        {
          ...resultColumns[0],
          name: 'changed the name'
        },
        resultColumns[1]
      ];
      const importSource = {
        version: 2,
        importMode: 'UPLOAD_DATA',
        fileName: 'myfile.csv',
        fileId: '123-abc',
        scanResults: summary,
        translation: {
          version: 1,
          content: {
            numHeaders: 1,
            columns: modifiedResultColumns
          }
        }
      };
      const actual = initialNewDatasetModel(theView, importSource);
      const expected = {
        ...initialStateWithTransform,
        transform: {
          ...initialStateWithTransform.transform,
          defaultColumns: resultColumns,
          columns: modifiedResultColumns,
          numHeaders: 1
        }
      };

      expect(normalize(expected)).to.deep.equal(normalize(actual));
      // ;_; no idea why this doesn't work without the parse/stringify pairs
    });

  });
});
