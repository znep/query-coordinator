import PropTypes from 'prop-types';
import React, { Component } from 'react';
import I18n from 'common/i18n';

const PreviewElement = ({ previewUrl, previewType, blobName }) => {
  switch (previewType) {
    case 'image':
      return <img src={previewUrl} alt={blobName} />;

    case 'google_viewer':
      var location = document.location;
      var url = `${location.protocol}//${location.hostname}${previewUrl}`;
      return (
        <iframe src={`//docs.google.com/gview?url=${url}&embedded=true`} />
      );

    default:
      return null;
  }
};

PreviewElement.propTypes = {
  previewUrl: PropTypes.string.isRequired,
  previewType: PropTypes.string.isRequired,
  blobName: PropTypes.string
};

export class BlobPreview extends Component {
  render() {
    const { isPreviewable, previewUrl, previewType, blobName } = this.props;
    if (
      !isPreviewable ||
      (previewType !== 'image' && previewType !== 'google_viewer')
    ) {
      return null;
    }

    return (
      <section className="blob-preview">
        <h2>{I18n.t('shared.components.blobs.preview')}</h2>
        <PreviewElement
          previewUrl={previewUrl}
          previewType={previewType}
          blobName={blobName} />
      </section>
    );
  }
}

BlobPreview.propTypes = {
  isPreviewable: PropTypes.bool.isRequired,
  previewUrl: PropTypes.string,
  previewType: PropTypes.string,
  blobName: PropTypes.string
};

export default BlobPreview;
