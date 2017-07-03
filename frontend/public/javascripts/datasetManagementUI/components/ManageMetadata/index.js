import React, { PropTypes, Component } from 'react';
import _ from 'lodash';
import { connect } from 'react-redux';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'common/components';
import { editView } from 'actions/views';
import { dismissMetadataPane, saveDatasetMetadata, saveColumnMetadata } from 'actions/manageMetadata';
import { hideFlashMessage } from 'actions/flashMessage';
import { SAVE_DATASET_METADATA, SAVE_COLUMN_METADATA } from 'actions/apiCalls';
import ApiCallButton from 'components/ApiCallButton';
import MetadataContent from 'components/ManageMetadata/MetadataContent';
import { datasetMetadata } from 'selectors';
import styles from 'styles/ManageMetadata/ManageMetadata.scss';

export class ManageMetadata extends Component {
  constructor() {
    super();
    this.state = {
      initialDatasetMetadata: null
    };
  }

  componentWillMount() {
    const { view } = this.props;
    this.setState({
      initialDatasetMetadata: datasetMetadata(view)
    });
  }

  render() {
    const {
      fourfour,
      path,
      onDismiss,
      onCancel,
      onSaveDataset,
      onSaveCol,
      columnsExist,
      onSidebarTabClick
    } = this.props;

    const metadataContentProps = { path, fourfour, onSidebarTabClick, columnsExist };

    const onDatasetTab = path === 'metadata/dataset';

    let saveBtnProps;

    if (onDatasetTab) {
      saveBtnProps = {
        operation: SAVE_DATASET_METADATA,
        params: {},
        onClick: onSaveDataset
      };
    } else {
      saveBtnProps = {
        operation: SAVE_COLUMN_METADATA,
        params: {},
        onClick: onSaveCol
      };
    }

    return (
      <div className={styles.manageMetadata}>
        <Modal fullScreen onDismiss={onDismiss}>
          <ModalHeader title={I18n.metadata_manage.title} onDismiss={onDismiss} />

          <ModalContent>
            <MetadataContent {...metadataContentProps} />
          </ModalContent>

          <ModalFooter>
            <button
              id="cancel"
              className={styles.button}
              onClick={() => onCancel(fourfour, this.state.initialDatasetMetadata)}>
              {I18n.common.cancel}
            </button>
            <ApiCallButton {...saveBtnProps} />
          </ModalFooter>
        </Modal>
      </div>
    );
  }
}

ManageMetadata.propTypes = {
  onDismiss: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSaveDataset: PropTypes.func.isRequired,
  onSaveCol: PropTypes.func.isRequired,
  onSidebarTabClick: PropTypes.func,
  view: PropTypes.object.isRequired,
  fourfour: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  columnsExist: PropTypes.bool
};

const mapDispatchToProps = dispatch => ({
  onDismiss: () => dispatch(dismissMetadataPane()),
  onCancel: (fourfour, initialDatasetMetadata) => {
    dispatch(editView(fourfour, initialDatasetMetadata));
    dispatch(dismissMetadataPane());
  },
  onSaveDataset: () => dispatch(saveDatasetMetadata()),
  onSaveCol: () => dispatch(saveColumnMetadata()),
  onSidebarTabClick: fourfour => {
    dispatch(hideFlashMessage());

    dispatch(editView(fourfour, { displayMetadataFieldErrors: true }));
  }
});

const mapStateToProps = ({ entities, ui }, ownProps) => ({
  fourfour: ui.routing.fourfour,
  view: entities.views[ui.routing.fourfour],
  path: ownProps.route.path,
  columnsExist: !_.isEmpty(entities.output_columns)
});

export default connect(mapStateToProps, mapDispatchToProps)(ManageMetadata);
