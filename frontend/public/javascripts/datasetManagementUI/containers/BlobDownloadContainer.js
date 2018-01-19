import { connect } from 'react-redux';
import { BlobDownload } from 'common/components';
import { exportSource } from 'datasetManagementUI/links/dsmapiLinks';

export function mapStateToProps(state, { source, revision }) {
  return {
    showDownloadSection: true,
    showManageSection: false,
    blobFilename: source.export_filename,
    blobMimeType: source.content_type,
    downloadLink: exportSource(revision.revision_seq, source.id)
  };
}

export default connect(mapStateToProps)(BlobDownload);
