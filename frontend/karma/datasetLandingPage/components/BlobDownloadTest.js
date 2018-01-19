import { assert } from 'chai';
import _ from 'lodash';
import { shallow } from 'enzyme';
import { mapStateToProps } from 'datasetLandingPage/components/BlobDownload';
import mockServerConfig from '../data/mockServerConfig';

describe('BlobDownload mapStateToProps', () => {
  const defaultState = {
    view: {
      id: 'viewId',
      isBlobby: true,
      blobId: 'globally-unique-identifier',
      blobFilename: 'purple.png',
      blobMimeType: 'image/png',
      blobType: 'image',
      editUrl: 'something/edit'
    }
  }

  it('sets blobFilename to view.blobFilename', () => {
    assert.equal(mapStateToProps(defaultState).blobFilename, defaultState.view.blobFilename);
  });

  it('sets editBlobSourceLink to contain view.editURL', () => {
    assert.include(mapStateToProps(defaultState).editBlobSourceLink, defaultState.view.editUrl);
  });

  it('sets downloadLink using view state', () => {
    assert.include(mapStateToProps(defaultState).downloadLink, defaultState.view.id);
    assert.include(mapStateToProps(defaultState).downloadLink, 'image');
    assert.include(mapStateToProps(defaultState).downloadLink, 'png');
  });

  describe('showDownloadSection', () => {
    it('sets showDownloadSection to true if view is blobbby', () => {
      assert.isTrue(mapStateToProps(defaultState).showDownloadSection);
    });

    it('sets showDownloadSection to false if the view is not blobby', () => {
      const newState = {view: {...defaultState.view, isBlobby: false}}
      assert.isFalse(mapStateToProps(newState).showDownloadSection);
    });
  });

  describe('showManageSection', () => {

    it('is false if the user is not a publisher or an admin', () => {
      window.serverConfig.currentUser = null;
      assert.isFalse(mapStateToProps(defaultState).showManageSection)
    });

    it('is true if the user has the edit_others_datasets right', () => {
      window.serverConfig.currentUser = { rights: [ 'edit_others_datasets' ] };
      assert.isTrue(mapStateToProps(defaultState).showManageSection)
    });

  });
});
