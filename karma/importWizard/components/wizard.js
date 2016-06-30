import {
  updateNavigation,
  chooseOperation,
  goToPage,
  goToPrevious
} from 'wizard';
import { fileUploadComplete } from 'components/uploadFile';

describe('updateNavigation', () => {
  const initialState = {
    operation: null,
    page: 'SelectType',
    path: []
  }

  it('sets currentPage to SelectUploadType when you choose UploadData', () => {
    const stateAfter = updateNavigation(initialState, chooseOperation('UploadData'));
    expect(stateAfter).to.deep.equal({
      operation: 'UploadData',
      page: 'SelectUploadType',
      path: [ ...initialState.path, initialState.page ]
    });
  });

  it('sets currentPage to UploadFile when you choose UploadBlob', () => {
    const stateAfter = updateNavigation(initialState, chooseOperation('UploadBlob'));
    expect(stateAfter).to.deep.equal({
      operation: 'UploadBlob',
      page: 'UploadFile',
      path: [ ...initialState.path, initialState.page ]
    });
  });

  it('sets currentPage to UploadFile when you choose UploadGeospatial', () => {
    const stateAfter = updateNavigation(initialState, chooseOperation('UploadGeospatial'));
    expect(stateAfter).to.deep.equal({
      operation: 'UploadGeospatial',
      page: 'UploadFile',
      path: [ ...initialState.path, initialState.page ]
    });
  });

  it('sets currentPage to Metadata when you choose ConnectToEsri', () => {
    const stateAfter = updateNavigation(initialState, chooseOperation('ConnectToEsri'));
    expect(stateAfter).to.deep.equal({
      operation: 'ConnectToEsri',
      page: 'Metadata',
      path: [ ...initialState.path, initialState.page ]
    });
  });

  it('sets currentPage to Metadata when you choose LinkToExternal', () => {
    const stateAfter = updateNavigation(initialState, chooseOperation('LinkToExternal'));
    expect(stateAfter).to.deep.equal({
      operation: 'LinkToExternal',
      page: 'Metadata',
      path: [ ...initialState.path, initialState.page ]
    });
  });

  it('sets currentPage to Metadata when you choose CreateFromScratch', () => {
    const stateAfter = updateNavigation(initialState, chooseOperation('CreateFromScratch'));
    expect(stateAfter).to.deep.equal({
      operation: 'CreateFromScratch',
      page: 'Metadata',
      path: [ ...initialState.path, initialState.page ]
    });
  });

  it('goes to ImportShapefile when a shapefile upload completes', () => {
    const stateBefore = {
      operation: 'UploadGeospatial',
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
      operation: 'UploadGeospatial',
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
