import { expect, assert } from 'chai';
import { withMockFetch, testThunk } from '../asyncUtils';

import * as SaveState from 'saveState';

import { fileUploadComplete  } from 'components/uploadFile';
import { combineReducers } from 'redux';

import * as Wizard from 'wizard';
import * as Server from 'server';
import * as Upload from 'components/uploadFile';
import * as Download from 'components/downloadFile';
import * as Metadata from 'components/metadata';
import * as ImportColumns from 'components/importColumns';
import * as ImportShapefile from 'components/importShapefile';
import * as ConnectToEsri from 'components/connectToEsri';

describe('saveState', function() {
  this.timeout(SaveState.SHOW_RESPONSE_MS + 100);

  const initialState = {
    datasetId: 'asdf-jklo',
    lastSavedVersion: 123,
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

  it('saves the operation, returning an ImportSource object with the new version timestamp', (done) => {

    function identityReducer(model = null, action) { // eslint-disable-line no-unused-vars
      return model;
    }

    const mockUpdate = combineReducers({
      datasetId: identityReducer,
      lastSavedVersion: SaveState.update,
      navigation: Wizard.updateNavigation,
      upload: Upload.update,
      download: Download.update,
      connectToEsri: ConnectToEsri.update,
      transform: ImportColumns.update, // null except in the UPLOAD_DATA operation
      importStatus: Server.update,
      layers: ImportShapefile.update,
      metadata: Metadata.update
    });

    withMockFetch(
      (url, options, resolve, reject) => {
        expect(url).to.equal(`/views/${initialState.datasetId}/import_sources`);

        const state = 'foo';
        const requestBody = JSON.parse(options.body)

        expect(requestBody.version).to.equal(123);
        expect(JSON.parse(requestBody.state)).to.deep.equal(initialState);

        resolve({
          status: 200,
          json: () => Promise.resolve({
            state: JSON.stringify(state),
            version: 124
          })
        })
      },
      () => {
        testThunk(
          done,
          SaveState.save(),
          initialState,
          mockUpdate,
          [
            (state, action) => {
              expect(action).to.deep.equal({
                type: SaveState.STATE_SAVE_STARTED
              });
            },
            (state, action) => {
              expect(action.type).to.eql('STATE_SAVE_COMPLETE');
              expect(action.importSource.version).to.eql(124)
              expect(state.lastSavedVersion).to.equal(124);
            },
            (state, action) => {
              expect(action.type).to.eql('RERENDER_SAVE_BUTTON');
            }
          ]
        )
      }
    );
  });

});

describe ("saveState's reducer", () => {
  it('it handles fileUploadComplete', () => {
    const result = SaveState.update(33, fileUploadComplete(
      'fake fileID',
      {},
      444
    ));
    expect(result).to.deep.equal(444)
  })
})
