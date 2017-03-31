import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';

import DatasetForm from 'components/ManageMetadata/DatasetForm';
import FlashMessage from 'components/FlashMessage/FlashMessage';
import styles from 'styles/ManageMetadata/DatasetMetadataEditor.scss';

class DatasetMetadataEditor extends Component {
  constructor() {
    super();

    this.state = {
      flashHeight: 0
    };

    _.bindAll('getHeight');
  }

  getHeight(node) {
    if (!node) {
      return;
    }

    if (node.offsetHeight !== this.state.flashHeight) {
      this.setState({
        flashHeight: node.offsetHeight
      });
    }
  }

  render() {
    const { flashVisible } = this.props;

    // push form down to make room for flash notification if it's visible
    let formPadding = {
      paddingTop: flashVisible ? this.state.flashHeight + 12 : 0
    };

    return (
      <div className={styles.container}>
        <div className={styles.flashContainer} ref={flash => this.getHeight(flash)}>
          <FlashMessage />
        </div>
        <div className={styles.formContainer} style={formPadding}>
          <DatasetForm />
        </div>
        <div className={styles.requiredNote} style={formPadding}>
          {I18n.metadata_manage.required_note}
        </div>
      </div>
    );
  }
}

DatasetMetadataEditor.propTypes = {
  flashVisible: PropTypes.bool.isRequired
};

const mapStateToProps = ({ flashMessage }) => ({
  flashVisible: flashMessage.visible
});

export default connect(mapStateToProps)(DatasetMetadataEditor);
