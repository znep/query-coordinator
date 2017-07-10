import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import DatasetForm from 'components/Forms/DatasetForm';
import ColumnForm from 'components/Forms/ColumnForm';
import FlashMessage from 'components/FlashMessage/FlashMessage';
import styles from 'styles/ManageMetadata/MetadataEditor.scss';

class MetadataEditor extends Component {
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
    const { flashVisible, path } = this.props;

    const onDatasetTab = path === 'metadata/dataset';

    // push form down to make room for flash notification if it's visible
    let formPadding = {
      paddingTop: flashVisible ? this.state.flashHeight + 12 : 0
    };

    return (
      <div className={styles.container}>
        <div className={styles.flashContainer} ref={flash => this.getHeight(flash)}>
          <FlashMessage />
        </div>
        <div
          className={onDatasetTab ? styles.datasetFormContainer : styles.columnFormContainer}
          style={formPadding}>
          {onDatasetTab ? <DatasetForm /> : <ColumnForm />}
        </div>
        {onDatasetTab &&
          <div className={styles.requiredNote} style={formPadding}>
            {I18n.metadata_manage.required_note}
          </div>}
      </div>
    );
  }
}

MetadataEditor.propTypes = {
  flashVisible: PropTypes.bool.isRequired,
  path: PropTypes.string.isRequired
};

const mapStateToProps = ({ ui }, { path }) => ({
  flashVisible: ui.flashMessage.visible,
  path
});

export default connect(mapStateToProps)(MetadataEditor);
