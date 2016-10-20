import {
  updateNavigation,
  chooseOperation,
  goToPage,
  goToPrevious,
  initialNewDatasetModel
} from 'wizard';

import { combineReducers } from 'redux';
import { fileUploadComplete } from 'components/uploadFile';
import * as ImportColumns from 'components/importColumns';
import * as SaveState from 'saveState';
import * as LocationColumn from 'components/importColumns/locationColumn';
import { withMockFetch, testThunk } from '../asyncUtils';

describe('updateNavigation', function() {
  this.timeout(SaveState.SHOW_RESPONSE_MS + 100);

  const initialState = {
    operation: null,
    page: 'SelectType',
    path: []
  };

  it('sets currentPage to SelectUploadType when you choose UPLOAD_DATA', () => {
    const actualState = updateNavigation(initialState, chooseOperation('UPLOAD_DATA'));

    expect(actualState).to.eql({
      operation: 'UPLOAD_DATA',
      page: 'SelectUploadType',
      path: [ ...initialState.path, initialState.page ]
    })
  });

  it('sets currentPage to UploadFile when you choose UPLOAD_BLOB', () => {
    const actualState = updateNavigation(initialState, chooseOperation('UPLOAD_BLOB'));

    expect(actualState).to.eql({
      operation: 'UPLOAD_BLOB',
      page: 'UploadFile',
      path: [ ...initialState.path, initialState.page ]
    });
  });

  it('sets currentPage to UploadFile when you choose UPLOAD_GEO', () => {
    const actualState = updateNavigation(initialState, chooseOperation('UPLOAD_GEO'));

    expect(actualState).to.eql({
      operation: 'UPLOAD_GEO',
      page: 'UploadFile',
      path: [ ...initialState.path, initialState.page ]
    });
  });

  it('sets currentPage to Metadata when you choose CONNECT_TO_ESRI', () => {
    const actualState = updateNavigation(initialState, chooseOperation('CONNECT_TO_ESRI'));

    expect(actualState).to.eql({
      operation: 'CONNECT_TO_ESRI',
      page: 'ConnectToEsri',
      path: [ ...initialState.path, initialState.page ]
    });
  });

  it('sets currentPage to Metadata when you choose LINK_EXTERNAL', () => {
    const actualState = updateNavigation(initialState, chooseOperation('LINK_EXTERNAL'));

    expect(actualState).to.eql({
      operation: 'LINK_EXTERNAL',
      page: 'Metadata',
      path: [ ...initialState.path, initialState.page ]
    });
  });

  it('sets currentPage to Metadata when you choose CREATE_FROM_SCRATCH', () => {
    const actualState = updateNavigation(initialState, chooseOperation('CREATE_FROM_SCRATCH'));

    expect(actualState).to.eql({
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
    lastSavedVersion: 0,
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
      privacySettings: 'private',
      apiCall: {
        type: 'NotStarted'
      },
      privacyApiCall: {
        type: 'NotStarted'
      },
      contents: {
        name: 'foo',
        displayType: 'draft',
        href: '',
        description: '',
        category: '',
        tags: [],
        rowLabel: 'Row',
        mapLayer: null,
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
      },
      license: {
        licenseName: '',
        licensing: '',
        licenseId: '',
        attribution: '',
        sourceLink: null
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
          mapLayer: null,
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
          contactEmail: ''
        },
        lastSavedLicense: {
          licenseName: '',
          licensing: '',
          licenseId: '',
          attribution: '',
          sourceLink: null
        },
        lastSavedPrivacySettings: 'private'
      }
    },
    importStatus: {
      type: 'NotStarted'
    }
  };

  const serverState = {
    version: 2,
    state: JSON.stringify(initialState)
  }

  it('returns an initial state when `importSource` is null', () => {
    const actual = initialNewDatasetModel(theView, null);
    expect(initialState).to.deep.equal(actual);
  });

  it('returns the importSource state when it is present', () => {
    const actual = initialNewDatasetModel(theView, serverState);

    expect({...initialState, lastSavedVersion: 2}).to.deep.equal(actual);
  });

  it('an InProgress issEvent makes the navigation page `Importing` and the importStatus populated', () => {
    const issActivities = [
      {
        "activity_name": "Readmissions_and_Deaths_-_Hospital.csv",
        "activity_type": "Import",
        "created_at": "2016-09-28T18:28:42.809Z",
        "domain": "localhost",
        "entity_id": "m25r-6t74",
        "entity_type": "Dataset",
        "id": "07469d55-6158-4051-8ba0-a84bb165da94",
        "latest_event": {
          "activity_id": "07469d55-6158-4051-8ba0-a84bb165da94",
          "event_id": "da9b4e4e-efd1-47ab-9a82-fcb91058026f",
          "event_time": "2016-09-28T18:28:54.305Z",
          "event_type": "row-progress",
          "id": 34107,
          "info": {
            "rowsComplete": 9500,
            "totalRows": 0
          },
          "status": "InProgress"
        },
        "service": "Imports2",
        "status": "InProgress",
        "user_id": "kacw-u8uj"
      }
    ]
    const actual = initialNewDatasetModel(theView, serverState, issActivities);
    expect(actual).to.deep.equal({
      ...initialState,
      lastSavedVersion: 2,
      navigation: {
        ...initialState.navigation,
        page: 'Importing'
      },
      importStatus: {
        ticket: "07469d55-6158-4051-8ba0-a84bb165da94",
        type: 'InProgress',
        progress: {
          rowsImported: 9500,
          stage: 'row-progress'
        }
      }
    });
  });

  it('a Complete issEvent makes the navigation page `Finish` and the importStatus populated', () => {
    const issActivities = [
      {
        "activity_name": "Readmissions_and_Deaths_-_Hospital.csv",
        "activity_type": "Import",
        "created_at": "2016-09-28T18:28:42.809Z",
        "domain": "localhost",
        "entity_id": "m25r-6t74",
        "entity_type": "Dataset",
        "id": "07469d55-6158-4051-8ba0-a84bb165da94",
        "latest_event": {
          "activity_id": "07469d55-6158-4051-8ba0-a84bb165da94",
          "event_id": "da9b4e4e-efd1-47ab-9a82-fcb91058026f",
          "event_time": "2016-09-28T18:28:54.305Z",
          "event_type": "row-progress",
          "id": 34107,
          "info": {
            "rowsComplete": 9500,
            "totalRows": 0
          },
          "status": "Success"
        },
        "service": "Imports2",
        "status": "Success",
        "user_id": "kacw-u8uj"
      }
    ]
    const actual = initialNewDatasetModel(theView, serverState, issActivities);
    expect(actual).to.deep.equal({
      ...initialState,
      lastSavedVersion: 2,
      navigation: {
        ...initialState.navigation,
        page: 'Finish'
      },
      importStatus: {
        type: 'Complete'
      }
    });
  });

  it('a Failed issEvent makes the navigation page `Metadata` and the importStatus populated', () => {
    const issActivities = [
      {
        "activity_name": "Readmissions_and_Deaths_-_Hospital.csv",
        "activity_type": "Import",
        "created_at": "2016-09-28T18:28:42.809Z",
        "domain": "localhost",
        "entity_id": "m25r-6t74",
        "entity_type": "Dataset",
        "id": "07469d55-6158-4051-8ba0-a84bb165da94",
        "latest_event": {
          "id": 34349,
          "event_time": "2016-09-29T19:43:05.254Z",
          "event_type": "invalid-row-length",
          "status": "Failure",
          "info": {
            "record": 64766,
            "actual": 1,
            "expected": 19,
            "type": "invalid-row-length"
          },
          "activity_id": "a48e6129-00e4-47b3-addf-6925d1171d00",
          "event_id": "2533d096-8266-4aed-a207-f2b854563965"
        }
      }
    ]
    const actual = initialNewDatasetModel(theView, serverState, issActivities);
    expect(actual).to.deep.equal({
      ...initialState,
      lastSavedVersion: 2,
      navigation: {
        ...initialState.navigation,
        page: 'Metadata'
      },
      importStatus: {
        error: "Row #64766 in your CSV file contained 1 fields, whereas your other rows contained 19 fields. Please ensure that your file has a consistent number of fields per row.",
        type: "Error"
      }
    });
  });
});
