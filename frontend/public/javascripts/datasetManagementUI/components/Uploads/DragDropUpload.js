import React, { PropTypes, Component } from 'react';
import _ from 'lodash';
import { connect } from 'react-redux';
import { createUpload } from 'actions/manageUploads';
import { showFlashMessage, hideFlashMessage } from 'actions/flashMessage';
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
      dispatch(showFlashMessage('error', 'wrong kind of file, fool!'));
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
    const { dispatch } = this.props;

    return (
      <section className={styles.container}>
        <h2>Replace Data</h2>
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
              <h2>Drag a New Data File Here</h2>
              <div className={styles.browseMsg}>...or click Browse to choose a file from your computer</div>
              <div className={styles.fileTypes}>Supported file types are .csv, .tsv, .xls, and .xlsx</div>
              <label id="upload-label" className={styles.uploadButton} htmlFor="file">
                Browse
              </label>
              <input
                id="file"
                name="file"
                type="file"
                accept=".csv,.tsv,.xls,.xlsx"
                aria-labelledby="upload-label"
                className={styles.uploadInput}
                onChange={e => dispatch(createUpload(e.target.files[0]))} />
            </div>
          </div>
        </div>
      </section>
    );
  }
}

DragDropUpload.propTypes = {
  dispatch: PropTypes.func.isRequired
};

export default connect()(DragDropUpload);
