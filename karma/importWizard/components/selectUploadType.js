import {
  updateNavigation,
  chooseDataSource,
  goToPage,
  goToPrevious,
  initialNewDatasetModel
} from 'wizard';
import { fileUploadComplete } from 'components/uploadFile';
import * as SaveState from 'saveState';
import { withMockFetch, testThunk } from '../asyncUtils';


describe('selectUploadType', function() {
  this.timeout(100);

  const initialState = {
    operation: 'UPLOAD_DATA',
    page: 'SelectUploadType',
    path: ['SelectType']
  };

  function testChooseDataSource(done, page, navigationStateAfter) {
    withMockFetch(
      (url, options, resolve, reject) => {
        resolve({
          status: 200,
          json: () => Promise.resolve({
            uiSection: page,
            version: 1470979299528
          })
        });
      },
      () => {
        testThunk(
          done,
          chooseDataSource(page),
          {
            lastSavedVersion: 1470000000000,
            navigation: initialState
          },
          [
            (state, action) => {
              expect(action).to.deep.equal({
                type: 'GO_TO_PAGE',
                page
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
                  uiSection: page,
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

  it('sets currentPage to UploadFile when you choose UploadFile', (done) => {
    testChooseDataSource(done, 'UploadFile', {
      operation: 'UPLOAD_DATA',
      page: 'UploadFile',
      path: [ ...initialState.path, initialState.page ]
    });
  });

  it('sets currentPage to DownloadFile when you choose DownloadFile', (done) => {
    testChooseDataSource(done, 'DownloadFile', {
      operation: 'UPLOAD_DATA',
      page: 'DownloadFile',
      path: [ ...initialState.path, initialState.page ]
    });
  });

});
