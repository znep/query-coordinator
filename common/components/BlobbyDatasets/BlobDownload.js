import PropTypes from 'prop-types';
import React, { Component } from 'react';
import I18n from 'common/i18n';

const ManagePrompt = ({ editLink }) => {
  return (
    <div className="alert default edit-prompt">
      <span className="edit-prompt-message">
        {I18n.t('shared.components.blobs.download.edit_prompt_message')}
      </span>

      <a href={editLink} className="btn btn-sm btn-default edit-prompt-button">
        {I18n.t('shared.components.blobs.download.edit_prompt_button')}
      </a>
    </div>
  );
};

ManagePrompt.propTypes = {
  editLink: PropTypes.string
};

export class BlobDownload extends Component {
  render() {
    const {
      showDownloadSection,
      showManageSection,
      blobFilename,
      downloadLink,
      editBlobSourceLink
    } = this.props;

    if (!showDownloadSection) {
      return null;
    }

    return (
      <section className="blob-download dataset-download-section">
        <h2>{I18n.t('shared.components.blobs.download.title')}</h2>

        {showManageSection && <ManagePrompt editLink={editBlobSourceLink} />}

        <div className="section-content">
          <div className="download-object">
            <div className="download-title">{blobFilename}</div>

            <div className="download-buttons">
              <a
                className="btn btn-primary download"
                href={downloadLink}
                target="_blank">
                <span className="icon-download" />
                {I18n.t('shared.components.blobs.download.download')}
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }
}

BlobDownload.propTypes = {
  showDownloadSection: PropTypes.bool.isRequired,
  showManageSection: PropTypes.bool,
  blobFilename: PropTypes.string,
  downloadLink: PropTypes.string,
  editBlobSourceLink: PropTypes.string
};

export default BlobDownload;
