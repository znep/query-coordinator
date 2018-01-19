import { assert } from 'chai';
import { mapStateToProps } from 'datasetManagementUI/containers/BlobPreviewContainer';

describe('containers/BlobPreviewContainer', function() {
  const defaultProps = {
    source: {
      id: 30,
      content_type: 'image/gif',
      export_filename: 'filename.gif'
    },
    revision: {
      revision_seq: 0
    }
  };

  it('sets isPreviewable to true when content_type is image-y', () => {
    assert.isTrue(mapStateToProps(null, defaultProps).isPreviewable);
  });

  it('sets isPreviewable to true when content_type is doc-y', () => {
    const newProps = {...defaultProps, source: {...defaultProps.source, content_type: 'application/msword'}}
    assert.isTrue(mapStateToProps(null, newProps).isPreviewable);
  });

  it('sets isPreviewable to false when content_type is not supported', () => {
    const newProps = {...defaultProps, source: {...defaultProps.source, content_type: 'application/zip'}}
    assert.isFalse(mapStateToProps(null, newProps).isPreviewable);
  });

  it('sets previewUrl to include the view elements', () => {
    const returnedProps = mapStateToProps(null, defaultProps)
    assert.include(returnedProps.previewUrl, defaultProps.source.id);
    assert.include(returnedProps.previewUrl, defaultProps.revision.revision_seq);
  });

  it('sets previewType to be image when content_type is image-y', () => {
    assert.equal(mapStateToProps(null, defaultProps).previewType, 'image');
  });

  it('sets previewType to be google_viewer when content_type is doc-y', () => {
    const newProps = {...defaultProps, source: {...defaultProps.source, content_type: 'application/msword'}}
    assert.equal(mapStateToProps(null, newProps).previewType, 'google_viewer');
  });

  it('sets blobName to source.export_filename', () => {
    assert.equal(mapStateToProps(null, defaultProps).blobName, defaultProps.source.export_filename);
  });
});
