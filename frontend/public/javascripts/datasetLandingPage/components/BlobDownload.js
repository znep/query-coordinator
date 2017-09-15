import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { userHasRight } from '../../common/user';
import * as Rights from '../../common/rights';
import { localizeLink } from '../../common/locale';

export class BlobDownload extends Component {
  renderManagePrompt() {
    const { view } = this.props;

    if (!userHasRight(Rights.edit_others_datasets)) {
      return null;
    }

    return (
      <div className="alert default edit-prompt">
        <span className="edit-prompt-message">
          {I18n.blob_download.edit_prompt_message}
        </span>

        <a href={localizeLink(view.editUrl)} className="btn btn-sm btn-default edit-prompt-button">
          {I18n.blob_download.edit_prompt_button}
        </a>
      </div>
    );
  }

  render() {
    const { view } = this.props;
    const { blobFilename, blobMimeType, isBlobby } = view;

    if (!isBlobby) {
      return null;
    }

    const href = `/download/${view.id}/${encodeURIComponent(_.replace(blobMimeType, /;.*/, ''))}`;

    return (
      <section className="landing-page-section blob-download download-section">
        <h2 className="landing-page-section-header">
          {I18n.blob_download.title}
        </h2>

        {this.renderManagePrompt()}

        <div className="section-content">
          <div className="download-object">
            <div className="download-title">
              {blobFilename}
            </div>

            <div className="download-buttons">
              <a className="btn btn-primary download" href={href} target="_blank">
                <span className="icon-download" />
                {I18n.blob_download.download}
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }
}

BlobDownload.propTypes = {
  view: PropTypes.object.isRequired
};

function mapStateToProps(state) {
  return _.pick(state, 'view');
}

export default connect(mapStateToProps)(BlobDownload);
