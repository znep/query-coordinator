import { expect, assert } from 'chai';
import { mapStateToProps } from 'datasetLandingPage/components/BlobPreview';

describe('components/BlobPreview', function() {
  const defaultState = {
    view: {
      isBlobby: true,
      blobId: 'guid',
      blobType: 'image'
    }
  };

  it('sets isPreviewable to true when view is blobby', () => {
    assert.isTrue(mapStateToProps(defaultState).isPreviewable);
  });

  it('sets isPreviewable to false when view is not blobby', () => {
    const newState = {view: {...defaultState.view, isBlobby: false}}
    assert.isFalse(mapStateToProps(newState).isPreviewable);
  });

  it('sets previewUrl to include the view elements', () => {
    const returnedProps = mapStateToProps(defaultState)
    assert.include(returnedProps.previewUrl, defaultState.view.id);
    assert.include(returnedProps.previewUrl, defaultState.view.blobId);
  });

  it('sets previewType to view.blobType', () => {
    assert.equal(mapStateToProps(defaultState).previewType, defaultState.view.blobType);
  });

  it('sets blobName to view.name', () => {
    assert.equal(mapStateToProps(defaultState).blobName, defaultState.view.blobName);
  });
});
