import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

export const BlobPreview = React.createClass({
  propTypes: {
    view: PropTypes.object.isRequired
  },

  renderPreview() {
    const { view } = this.props;

    const href = `/api/file_data/${view.blobId}`;

    switch (view.blobType) {
      case 'image':
        return <img src={href} alt={view.name} />;

      case 'google_viewer':
        var location = document.location;
        var url = `${location.protocol}//${location.hostname}${href}`;

        return <iframe src={`//docs.google.com/gview?url=${url}&embedded=true`} />;

      default:
        return null;
    }
  },

  render() {
    const { isBlobby, blobType } = this.props.view;

    if (!isBlobby || (blobType !== 'image' && blobType !== 'google_viewer')) {
      return null;
    }

    return (
      <section className="landing-page-section blob-preview">
        <h2 className="landing-page-section-header">
          {I18n.blob_preview.title}
        </h2>

        {this.renderPreview()}
      </section>
    );
  }
});

function mapStateToProps(state) {
  return _.pick(state, 'view');
}

export default connect(mapStateToProps)(BlobPreview);