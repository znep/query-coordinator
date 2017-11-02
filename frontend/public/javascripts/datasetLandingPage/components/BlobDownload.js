import { connect } from 'react-redux';
import { BlobDownload } from 'common/components';
import { userHasRight } from '../../common/user';
import * as Rights from '../../common/rights';
import { localizeLink } from 'common/locale';

export function mapStateToProps(state) {
  const view = state.view;
  const downloadLink = `/download/${view.id}/${encodeURIComponent(_.replace(view.blobMimeType, /;.*/, ''))}`;
  return {
    showDownloadSection: view.isBlobby,
    showManageSection: userHasRight(Rights.edit_others_datasets),
    blobFilename: view.blobFilename,
    downloadLink: downloadLink,
    editBlobSourceLink: localizeLink(view.editUrl)
  };
}

export default connect(mapStateToProps)(BlobDownload);
