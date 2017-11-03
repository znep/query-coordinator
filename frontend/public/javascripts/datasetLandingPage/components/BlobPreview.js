import { connect } from 'react-redux';
import { BlobPreview } from 'common/components';

export function mapStateToProps(state) {
  const { view } = state;

  if (!view.isBlobby) {
    return {
      isPreviewable: false
    };
  }

  return {
    isPreviewable: true,
    previewUrl: `/api/views/${view.id}/files/${view.blobId}`,
    previewType: view.blobType,
    blobName: view.name
  };
}

export default connect(mapStateToProps)(BlobPreview);
