import _ from 'lodash';

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { browserHistory } from 'react-router';
import { connect } from 'react-redux';
import * as Links from 'links/links';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'common/components';
import BlobPreview from 'containers/BlobPreviewContainer';
import BlobDownload from 'containers/BlobDownloadContainer';
import SaveBlobButton from 'components/SaveBlobButton/SaveBlobButton';
import { updateRevision, editRevision, shapeRevision } from 'reduxStuff/actions/revisions';
import FlashMessage from 'containers/FlashMessageContainer';
import SourceBreadcrumbs from 'containers/SourceBreadcrumbsContainer';

// TODO: clean up, internationalize as part of EN-19639
export class ShowBlobPreview extends Component {
  render() {
    const { source, revision, goHome, saveCurrentBlob } = this.props;

    return (
      <div className="blobPreview">
        <Modal fullScreen onDismiss={goHome}>
          <ModalHeader onDismiss={goHome}>
            <SourceBreadcrumbs atShowBlobPreview sourceId={source.id} />
          </ModalHeader>
          <ModalContent className="content content">
            <FlashMessage />
            <section>
              <BlobPreview source={source} revision={revision} />
              <div>
                <p id="source-filetype">Filetype: {source.content_type}</p>
                <p id="source-filesize">Filesize: {source.filesize}</p>
              </div>
              <BlobDownload source={source} revision={revision} />
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
