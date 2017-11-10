import _ from 'lodash';
import bytes from 'bytes';

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { browserHistory, Link } from 'react-router';
import { connect } from 'react-redux';
import * as Links from 'links/links';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'common/components';
import BlobPreview from 'containers/BlobPreviewContainer';
import BlobDownload from 'containers/BlobDownloadContainer';
import SaveBlobButton from 'components/SaveBlobButton/SaveBlobButton';
import { updateRevision, editRevision, shapeRevision } from 'reduxStuff/actions/revisions';
import FlashMessage from 'containers/FlashMessageContainer';
import SourceBreadcrumbs from 'containers/SourceBreadcrumbsContainer';

import styles from './ShowBlobPreview.scss';

export const BlobFileInfo = ({ source, sourcesLink }) => {
  return (
    <section className={styles.blobPreview}>
      {/* blob-preview is a styleguide/common class */}
      <h2>{I18n.blob_preview.whats_this}</h2>
      <div className={styles.blobFileInfo}>
        {source.content_type && <span id="sourceFiletype">
          <b>{I18n.blob_preview.filetype}:</b> {source.content_type}
        </span>}
        <br />
        <span id="sourceFilesize">
          <b>{I18n.blob_preview.filesize}:</b> {bytes(source.filesize)}
        </span>
      </div>
      {/* alert info is a styleguide/common class */}
      <div className={styles.alertInfo}>
        {I18n.blob_preview.non_parsable_format}
        <br />
        <br />
        {I18n.blob_preview.not_expecting}
        <br />
        <a href="https://support.socrata.com/hc/en-us/articles/115014872308" target="_blank">
          {I18n.blob_preview.get_help}
        </a>{' '}
        {I18n.blob_preview.or} <Link to={sourcesLink}>{I18n.blob_preview.choose_new}</Link>.
      </div>
    </section>
  );
};

BlobFileInfo.propTypes = {
  source: PropTypes.object.isRequired,
  sourcesLink: PropTypes.string.isRequired
};

export class ShowBlobPreview extends Component {
  render() {
    const { source, revision, sourcesLink, goHome, saveCurrentBlob } = this.props;

    return (
      <div>
        <Modal fullScreen onDismiss={goHome}>
          <ModalHeader onDismiss={goHome}>
            <SourceBreadcrumbs atShowBlobPreview sourceId={source.id} />
          </ModalHeader>
          <ModalContent className={styles.blobPreviewContainer}>
            <FlashMessage />
            <div className={styles.leftSection}>
              <BlobPreview source={source} revision={revision} />
              <BlobDownload source={source} revision={revision} />
            </div>
            <div className={styles.rightSection}>
              <BlobFileInfo source={source} sourcesLink={sourcesLink} />
            </div>
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
  sourcesLink: PropTypes.string.isRequired,
  goHome: PropTypes.func.isRequired,
  saveCurrentBlob: PropTypes.func.isRequired
};

export const mapStateToProps = (state, ownProps) => {
  const sourceId = _.toNumber(ownProps.params.sourceId);
  const source = state.entities.sources[sourceId];
  const sourcesLink = Links.sources(ownProps.params);

  const revisionSeq = _.toNumber(ownProps.params.revisionSeq);
  const revision = _.find(state.entities.revisions, {
    fourfour: ownProps.params.fourfour,
    revision_seq: revisionSeq
  });
  return { source, revision, sourcesLink };
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
