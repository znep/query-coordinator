import _ from 'lodash';

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { browserHistory } from 'react-router';
import { connect } from 'react-redux';
import * as Links from 'links/links';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'common/components';
import SaveBlobButton from 'components/SaveBlobButton/SaveBlobButton';
import { updateRevision, editRevision, shapeRevision } from 'reduxStuff/actions/revisions';
import { exportSource } from 'links/dsmapiLinks';
import FlashMessage from 'containers/FlashMessageContainer';
import SourceBreadcrumbs from 'containers/SourceBreadcrumbsContainer';

// TODO: clean up, internationalize as part of EN-19664
export class ShowBlobPreview extends Component {
  getBlobType() {
    const contentType = this.props.source.content_type;
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
      return 'link';
    }
  }

  getBlobPreview(previewUrl, filename) {
    switch (this.getBlobType()) {
      case 'image':
        return <img src={previewUrl} alt={filename} />;
      case 'google_viewer':
        var location = document.location;
        var url = `${location.protocol}//${location.hostname}${previewUrl}`;
        return <iframe src={`//docs.google.com/gview?url=${url}&embedded=true`} />;
      default:
        return null;
    }
  }

  render() {
    const { source, revision, goHome, saveCurrentBlob } = this.props;
    const previewUrl = exportSource(revision.revision_seq, source.id);
    return (
      <div className="blobPreview">
        <Modal fullScreen onDismiss={goHome}>
          <ModalHeader onDismiss={goHome}>
            <SourceBreadcrumbs atShowBlobPreview sourceId={source.id} />
          </ModalHeader>
          <ModalContent className="content content">
            <FlashMessage />
            <section>
              <h1>Preview</h1>
              <div>{this.getBlobPreview(previewUrl, source.filename)}</div>
              <div>
                <p>{source.filename}</p>
                <p>Filetype: {source.content_type}</p>
                <p>Filesize: {source.filesize}</p>
                <a href={previewUrl}>
                  <button>Download</button>
                </a>
              </div>
            </section>
          </ModalContent>
          <ModalFooter>
            <SaveBlobButton revision={revision} source={source} saveCurrentBlob={saveCurrentBlob} />
          </ModalFooter>
        </Modal>
      </div>
    );
  }
}

ShowBlobPreview.propTypes = {
  source: PropTypes.object.isRequired,
  revision: PropTypes.object.isRequired,
  goHome: PropTypes.func.isRequired,
  saveCurrentBlob: PropTypes.func.isRequired
};

export const mapStateToProps = (state, ownProps) => {
  const sourceId = _.toNumber(ownProps.params.sourceId);
  const source = state.entities.sources[sourceId];

  const revisionSeq = _.toNumber(ownProps.params.revisionSeq);
  const revision = _.find(state.entities.revisions, {
    fourfour: ownProps.params.fourfour,
    revision_seq: revisionSeq
  });
  return { source, revision };
};

export const mapDispatchToProps = (dispatch, ownProps) => ({
  goHome: () => browserHistory.push(Links.revisionBase(ownProps.params)),
  saveCurrentBlob: (revision, sourceId) => {
    const update = { blob_id: sourceId, output_schema_id: null };
    dispatch(updateRevision(update, ownProps.params))
      .then(resp => {
        const updatedRevision = shapeRevision(resp.resource);
        dispatch(editRevision(updatedRevision.id, updatedRevision));
      })
      .then(() => {
        browserHistory.push(Links.revisionBase(ownProps.params));
      });
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(ShowBlobPreview);
