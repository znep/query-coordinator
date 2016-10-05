import { withMockFetch, testThunk } from '../asyncUtils';

import * as SaveState from 'saveState';

import { fileUploadComplete  } from 'components/uploadFile';


describe('saveState', () => {

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
    withMockFetch(
      (url, options, resolve, reject) => {
        expect(url).to.equal('/views/asdf-jklo/import_sources');

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
          [
            (state, action) => {
              expect(action.type).to.eql('STATE_SAVE_STARTED')
              return state;
            },
            (state, action) => {
              expect(action.type).to.eql('STATE_SAVED');
              expect(action.version).to.eql(124)
              return state;
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
