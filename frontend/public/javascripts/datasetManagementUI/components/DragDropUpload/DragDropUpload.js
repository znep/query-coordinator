import PropTypes from 'prop-types';
import React, { Component } from 'react';
import _ from 'lodash';
import { connect } from 'react-redux';
import SourceMessage from 'datasetManagementUI/components/SourceMessage/SourceMessage';
import { createUploadSource } from 'datasetManagementUI/reduxStuff/actions/createSource';
import { showFlashMessage, hideFlashMessage } from 'datasetManagementUI/reduxStuff/actions/flashMessage';
import { enabledFileExtensions, formatExpanation } from 'datasetManagementUI/lib/fileExtensions';
import * as Selectors from 'datasetManagementUI/selectors';
import styles from './DragDropUpload.module.scss';
import uuid from 'uuid';

export class DragDropUpload extends Component {
  constructor() {
    super();
    this.state = {
      draggingOver: false,
      uploadApiCallId: null
    };
    _.bindAll(
      this, 'preventDefault', 'handleDrop', 'handleDragOver', 'handleDragLeave',
      'isApiCallPending', 'createUploadSource', 'generateDropzoneClassName',
      'handleBrowseFileChange'
    );
  }

  componentWillUnmount() {
    const { dispatch } = this.props;
    dispatch(hideFlashMessage());
  }

  preventDefault(e) {
    e.stopPropagation();
    e.preventDefault();
  }

  handleDragOver(e) {
    this.preventDefault(e);
    this.setState({
      draggingOver: true
    });
  }

  handleDragLeave(e) {
    this.preventDefault(e);
    this.setState({
      draggingOver: false
    });
  }

  createUploadSource(file) {
    const { dispatch, params } = this.props;
    const callId = uuid();
    this.setState({
      uploadApiCallId: callId
    });
    dispatch(createUploadSource(file, this.canBeParsed(file), params, callId));
  }

  handleDrop(e) {
    this.preventDefault(e);
    if (this.isApiCallPending()) {
      return;
    }
    const { dispatch } = this.props;
    const file = e.dataTransfer.files[0];
    const item = _.get(e, 'dataTransfer.items.0');
    let entry;

    if (item && item.getAsEntry) {
      entry = item.getAsEntry();
    } else if (item && item.webkitGetAsEntry) {
      entry = item.webkitGetAsEntry();
    }

    if (entry && entry.isDirectory) {
      dispatch(showFlashMessage('error', I18n.show_uploads.directory_error_message));
    } else if (file) {
      dispatch(hideFlashMessage());
      this.createUploadSource(file);
    } else {
      dispatch(showFlashMessage('error', I18n.show_uploads.flash_error_message));
    }

    this.setState({
      draggingOver: false
    });
  }

  handleBrowseFileChange(e) {
    if (!this.isApiCallPending()) {
      this.createUploadSource(e.target.files[0]);
    }
  }

  isApiCallPending() {
    const callId = this.state.uploadApiCallId;
    if (!callId) {
      return false;
    }

    const apiCall = this.props.apiCalls[callId];
    if (!apiCall || apiCall.succeededAt || apiCall.failedAt) {
      return false;
    }

    return true;
  }

  canBeParsed(file) {
    const matches = file.name.match(/(\.[^\.]+)$/);

    if (!matches) {
      return false;
    }
    const ext = matches[1];
    return enabledFileExtensions.includes(ext.toLowerCase());
  }

  generateDropzoneClassName() {
    if (this.isApiCallPending() && this.state.draggingOver) {
      return styles.dropZoneInvalidDragging;
    } else if (!this.isApiCallPending() && this.state.draggingOver) {
      return styles.dropZoneDragging;
    } else if (this.isApiCallPending() && !this.state.draggingOver) {
      return styles.isApiCallPending;
    }
    return styles.dropZone;
  }

  render() {
    const { hrefExists } = this.props;
    if (hrefExists) {
      return <SourceMessage hrefExists={hrefExists} />;
    }
    const enabledFileExtensionsStr = enabledFileExtensions.map(formatExpanation).join(', ');

    return (
      <section className={styles.container}>
        <div
          onDrop={this.handleDrop}
          onDragOver={this.handleDragOver}
          onDragLeave={this.handleDragLeave}
          className={this.generateDropzoneClassName()}>
          <div className={styles.imageContainer}>
            <img alt="upload" className={styles.image} src="/images/datasetManagementUI/copy-document.svg" />
          </div>
          <div className={styles.textContainer}>
            <div className={styles.content}>
              {
                this.isApiCallPending() ?
                  <div>
                    <h2>{I18n.show_uploads.preparing_upload}</h2>
                    {
                      this.isApiCallPending() &&
                      this.state.draggingOver &&
                        <div>{I18n.show_uploads.file_dropping_disabled}</div>
                    }
                  </div> :
                  <div>
                    <h2>{I18n.show_uploads.message}</h2>
                    <div className={styles.browseMsg}>{I18n.show_uploads.submessage}</div>
                    <label id="upload-label" className={styles.uploadButton} htmlFor="file">
                      Browse
                    </label>
                    <input
                      id="file"
                      name="file"
                      type="file"
                      aria-labelledby="upload-label"
                      className={styles.uploadInput}
                      onChange={this.handleBrowseFileChange} />
                    <div className={styles.fileTypes}>
                      {`${I18n.show_uploads.filetypes} ${enabledFileExtensionsStr}`}
                    </div>
                    <div className={styles.fileTypes}>{I18n.show_uploads.non_parsable_accepted}</div>
                    <div className={styles.fileTypes}>{I18n.show_uploads.dirs_not_supported}</div>
                  </div>
              }
            </div>
          </div>
        </div>
      </section>
    );
  }
}

DragDropUpload.propTypes = {
  dispatch: PropTypes.func.isRequired,
  params: PropTypes.object.isRequired,
  hrefExists: PropTypes.bool.isRequired,
  apiCalls: PropTypes.object.isRequired
};

const mapStateToProps = ({ entities, ui }, { params }) => {
  const rev = Selectors.currentRevision(entities, _.toNumber(params.revisionSeq));
  return {
    hrefExists: !!rev.href.length,
    apiCalls: ui.apiCalls
  };
};

export default connect(mapStateToProps)(DragDropUpload);
