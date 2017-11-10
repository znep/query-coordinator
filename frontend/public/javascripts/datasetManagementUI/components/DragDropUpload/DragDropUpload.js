import PropTypes from 'prop-types';
import React, { Component } from 'react';
import _ from 'lodash';
import { connect } from 'react-redux';
import SourceMessage from 'components/SourceMessage/SourceMessage';
import { createUploadSource } from 'reduxStuff/actions/createSource';
import { showFlashMessage, hideFlashMessage } from 'reduxStuff/actions/flashMessage';
import { enabledFileExtensions, formatExpanation } from 'lib/fileExtensions';
import * as Selectors from 'selectors';
import styles from './DragDropUpload.scss';

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

    if (file) {
      dispatch(hideFlashMessage());
      dispatch(createUploadSource(file, this.canBeParsed(file), this.props.params));
    } else {
      dispatch(showFlashMessage('error', I18n.show_uploads.flash_error_message));
    }

    this.setState({
      draggingOver: false
    });
  }

  canBeParsed(file) {
    const matches = file.name.match(/(\.[^\.]+)$/);

    if (!matches) {
      return false;
    }
    const ext = matches[1];
    return enabledFileExtensions.includes(ext.toLowerCase());
  }

  render() {
    const { dispatch, params, hrefExists } = this.props;

    if (hrefExists) {
      return <SourceMessage hrefExists={hrefExists} />;
    }

    return (
      <section className={styles.container}>
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
              <h2>{I18n.show_uploads.message}</h2>
              <div className={styles.browseMsg}>{I18n.show_uploads.submessage}</div>
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
                aria-labelledby="upload-label"
                className={styles.uploadInput}
                onChange={e =>
                  dispatch(
                    createUploadSource(e.target.files[0], this.canBeParsed(e.target.files[0]), params)
                  )} />
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
  hrefExists: PropTypes.bool.isRequired
};

const mapStateToProps = ({ entities }, { params }) => {
  const rev = Selectors.currentRevision(entities, _.toNumber(params.revisionSeq));
  return {
    hrefExists: !!rev.href.length
  };
};

export default connect(mapStateToProps)(DragDropUpload);
