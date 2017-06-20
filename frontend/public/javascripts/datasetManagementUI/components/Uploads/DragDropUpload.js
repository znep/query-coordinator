import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';
import { createUpload } from 'actions/manageUploads';
import _ from 'lodash';

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
      // TODO: prob change t flash message
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
      <div
        onDrop={this.handleDrop}
        onDragOver={this.preventDefault}
        style={{ border: '1px dashed blue', height: 300 }}>
        hello
      </div>
    );
  }
}

export default connect()(DragDropUpload);
