import { assert } from 'chai';
import { mapStateToProps } from 'datasetManagementUI/containers/BlobDownloadContainer';

describe('containers/BlobDownloadContainer', function() {
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

  it('sets showDownloadSection to true', () => {
    assert.isTrue(mapStateToProps(null, defaultProps).showDownloadSection);
  });

  it('sets showManageSection to false', () => {
    assert.isFalse(mapStateToProps(null, defaultProps).showManageSection);
  });

  it('sets blobFilename to source.export_filename', () => {
    assert.equal(mapStateToProps(null, defaultProps).blobFilename, defaultProps.source.export_filename);
  });

  it('sets blobMimeType to source.content_type', () => {
    assert.equal(mapStateToProps(null, defaultProps).blobMimeType, defaultProps.source.content_type);
  });

  it('sets downloadLink to contain revision_seq and source id', () => {
    assert.include(mapStateToProps(null, defaultProps).downloadLink, defaultProps.source.id);
    assert.include(mapStateToProps(null, defaultProps).downloadLink, defaultProps.revision.revision_seq);
  });

});
