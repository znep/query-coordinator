import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { isUserAdminOrPublisher } from '../lib/user';

export var BlobDownload = React.createClass({
  propTypes: {
    view: PropTypes.object.isRequired
  },

  renderManagePrompt: function() {
    var { view } = this.props;

    if (!isUserAdminOrPublisher()) {
      return null;
    }

    return (
      <div className="alert default edit-prompt">
        <span className="edit-prompt-message">
          {I18n.blob_download.edit_prompt_message}
        </span>

        <a href={view.editUrl} className="btn btn-sm btn-default edit-prompt-button">
          {I18n.blob_download.edit_prompt_button}
        </a>
      </div>
    );
  },

  render: function() {
    var { view } = this.props;
    var { blobFilename, blobMimeType, isBlobby } = view;

    if (!isBlobby) {
      return null;
    }

    var href = `/download/${view.id}/${encodeURIComponent(_.replace(blobMimeType, /;.*/, ''))}`;

    return (
      <section className="landing-page-section blob-download">
        <h2 className="landing-page-section-header">
          {I18n.blob_download.title}
        </h2>

        {this.renderManagePrompt()}

        <div className="section-content">
          <div className="file-info">
            {blobFilename}
          </div>

          <a className="btn btn-primary download" href={href} target="_blank">
            <span className="icon-download" />
            {I18n.blob_download.download}
          </a>
        </div>
      </section>
    );
  }
});

function mapStateToProps(state) {
  return _.pick(state, 'view');
}

export default connect(mapStateToProps)(BlobDownload);
