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

  it('sets currentPage to UploadFile when you choose UploadFile', () => {
    const actual = updateNavigation(initialState, goToPage('UploadFile'))

    expect(actual).to.eql({
      operation: 'UPLOAD_DATA',
      page: 'UploadFile',
      path: [ ...initialState.path, initialState.page ]
    });
  });

  it('sets currentPage to DownloadFile when you choose DownloadFile', () => {
    const actual = updateNavigation(initialState, goToPage('DownloadFile'))

    expect(actual).to.eql({
      operation: 'UPLOAD_DATA',
      page: 'DownloadFile',
      path: [ ...initialState.path, initialState.page ]
    });
  });

});
