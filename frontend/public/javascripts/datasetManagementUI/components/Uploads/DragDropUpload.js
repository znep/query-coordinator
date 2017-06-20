import React, { PropTypes, Component } from 'react';
import _ from 'lodash';
import { connect } from 'react-redux';
import { createUpload } from 'actions/manageUploads';
import styles from 'styles/Uploads/DragDropUpload.scss';

export class DragDropUpload extends Component {
  constructor() {
    super();
    _.bindAll(this, 'preventDefault', 'handleDrop');
  }

  preventDefault(e) {
    e.stopPropagation();
    e.preventDefault();
  }

  handleDrop(e) {
    this.preventDefault(e);
    const { dispatch } = this.props;
    const file = e.dataTransfer.files[0];

    if (file && this.isValidFile(file)) {
      dispatch(createUpload(file));
    } else {
      // TODO: prob change to flash message
      alert('bad file type');
    }
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
    return (
      <section className={styles.container}>
        <h2>Replace Data</h2>
        <div onDrop={this.handleDrop} onDragOver={this.preventDefault} className={styles.dropZone}>
          hello
        </div>
      </section>
    );
  }
}

DragDropUpload.propTypes = {
  dispatch: PropTypes.func.isRequired
};

export default connect()(DragDropUpload);
