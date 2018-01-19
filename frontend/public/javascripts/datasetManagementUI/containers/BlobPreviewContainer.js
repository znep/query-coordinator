import _ from 'lodash';
import { connect } from 'react-redux';
import { BlobPreview } from 'common/components';
import { exportSource } from 'datasetManagementUI/links/dsmapiLinks';

function getBlobType(contentType) {
  if (!contentType) {
    // sometimes its null
    return 'no_preview';
  }
  // should match definitions in frontend/app/models/displays/blob.rb
  const googleViewables = [
    'application/pdf',
    'application/vndms-powerpoint',
    'image/tiff',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  const imageViewables = ['image/jpeg', 'image/gif', 'image/png'];
  if (
    _.some(googleViewables, ct => {
      return contentType.match(ct);
    })
  ) {
    return 'google_viewer';
  } else if (
    _.some(imageViewables, ct => {
      return contentType.match(ct);
    })
  ) {
    return 'image';
  } else {
    return 'no_preview';
  }
}

export function mapStateToProps(state, { source, revision }) {
  const blobType = getBlobType(source.content_type);

  return {
    isPreviewable: blobType !== 'no_preview',
    previewUrl: exportSource(revision.revision_seq, source.id),
    previewType: blobType,
    blobName: source.export_filename
  };
}

export default connect(mapStateToProps)(BlobPreview);
