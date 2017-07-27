import React, { PropTypes, Component } from 'react';
import _ from 'lodash';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { createUpload } from 'actions/manageUploads';
import { showFlashMessage, hideFlashMessage } from 'actions/flashMessage';
import { enabledFileExtensions, formatExpanation } from 'lib/fileExtensions';
import styles from 'styles/Uploads/DragDropUpload.scss';

export class DragDropUpload extends Component {
  constructor() {
    super();
    this.state = {
      draggingOver: false
    };
    _.bindAll(this, 'preventDefault', 'handleDrop', 'handleDragOver', 'handleDragLeave');
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

  handleDrop(e) {
    this.preventDefault(e);
    const { dispatch } = this.props;
    const file = e.dataTransfer.files[0];

    if (file && this.isValidFile(file)) {
      dispatch(hideFlashMessage());
      dispatch(createUpload(file));
    } else {
      dispatch(showFlashMessage('error', I18n.show_uploads.flash_error_message));
    }

    this.setState({
      draggingOver: false
    });
  }

  isValidFile(file) {
    const validExtensions = ['csv', 'tsv', 'xls', 'xlsx'];
    const matches = file.name.match(/\.([^\.]+)$/);

    if (!matches) {
      return false;
    }

    const ext = matches[1];

    return validExtensions.includes(ext.toLowerCase());
  }

  render() {
    const { dispatch, location } = this.props;

    return (
      <section className={styles.container}>
        <h2>
          {I18n.show_uploads.title}
        </h2>
        <div
          onDrop={this.handleDrop}
          onDragOver={this.handleDragOver}
          onDragLeave={this.handleDragLeave}
          className={this.state.draggingOver ? styles.dropZoneDragging : styles.dropZone}>
          <div className={styles.imageContainer}>
            <img alt="upload" className={styles.image} src="/images/datasetManagementUI/copy-document.svg" />
          </div>
          <div className={styles.textContainer}>
            <div className={styles.content}>
              <h2>
                {I18n.show_uploads.message}
              </h2>
              <div className={styles.browseMsg}>
                {I18n.show_uploads.submessage}
              </div>
              <div className={styles.fileTypes}>
                {`${I18n.show_uploads.filetypes} ${enabledFileExtensions.map(formatExpanation).join(', ')}`}
              </div>
              <label id="upload-label" className={styles.uploadButton} htmlFor="file">
                Browse
              </label>
              <input
                id="file"
                name="file"
                type="file"
                accept={enabledFileExtensions.join(',')}
                aria-labelledby="upload-label"
                className={styles.uploadInput}
                onChange={e => dispatch(createUpload(e.target.files[0], location))} />
            </div>
          </div>
        </div>
      </section>
    );
  }
}

DragDropUpload.propTypes = {
  dispatch: PropTypes.func.isRequired,
  location: PropTypes.shape({
    pathname: PropTypes.string
  })
};

export default withRouter(connect()(DragDropUpload));
