import React, { PropTypes, Component } from 'react';
import _ from 'lodash';
import { connect } from 'react-redux';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'common/components';
import { editView } from 'actions/views';
import { addOutputColumns } from 'actions/outputColumns';
import { dismissMetadataPane, saveDatasetMetadata, saveColumnMetadata } from 'actions/manageMetadata';
import { hideFlashMessage } from 'actions/flashMessage';
import { SAVE_DATASET_METADATA, SAVE_COLUMN_METADATA } from 'actions/apiCalls';
import ApiCallButton from 'components/ApiCallButton';
import MetadataContent from 'components/ManageMetadata/MetadataContent';
import { datasetMetadata } from 'selectors';
import { getCurrentColumns } from 'models/forms';
import styles from 'styles/ManageMetadata/ManageMetadata.scss';

export class ManageMetadata extends Component {
  constructor() {
    super();
    this.state = {
      initialDatasetMetadata: null,
      initialColMetadata: null
    };

    _.bindAll(this, ['revertChanges', 'handleSaveClick', 'handleCancelClick', 'handleTabClick']);
  }

  componentWillMount() {
    const { view, currentColumns } = this.props;

    this.setState({
      initialDatasetMetadata: datasetMetadata(view),
      initialColMetadata: currentColumns
    });
  }

  revertChanges() {
    const { dispatch, fourfour } = this.props;

    dispatch(
      editView(fourfour, {
        ...this.state.initialDatasetMetadata,
        columnFormDirty: false,
        datasetFormDirty: false
      })
    );

    dispatch(addOutputColumns(this.state.initialColMetadata));
  }

  handleSaveClick(e) {
    e.preventDefault();

    const { dispatch, view, currentColumns, path } = this.props;

    const onDatasetTab = path === 'metadata/dataset';

    if (onDatasetTab && view.datasetFormDirty) {
      dispatch(saveDatasetMetadata())
        .then(() => {
          this.setState({
            initialDatasetMetadata: datasetMetadata(view)
          });
        })
        .catch(() => console.warn('Save failed'));
    } else if (view.columnFormDirty) {
      dispatch(saveColumnMetadata())
        .then(() => {
          this.setState({
            initialColMetadata: currentColumns
          });
        })
        .catch(() => console.warn('Save failed'));
    } else {
      return undefined;
    }
  }

  handleCancelClick() {
    const { dispatch } = this.props;

    this.revertChanges();

    dispatch(dismissMetadataPane());
  }

  handleTabClick() {
    const { dispatch, fourfour } = this.props;

    dispatch(hideFlashMessage());

    dispatch(editView(fourfour, { showErrors: true }));
  }

  render() {
    const { fourfour, path, columnsExist, view } = this.props;

    const metadataContentProps = { path, fourfour, onSidebarTabClick: this.handleTabClick, columnsExist };

    const onDatasetTab = path === 'metadata/dataset';

    let saveBtnProps;

    if (onDatasetTab) {
      saveBtnProps = {
        operation: SAVE_DATASET_METADATA,
        params: {},
        onClick: this.handleSaveClick,
        forceDisable: !view.datasetFormDirty
      };
    } else {
      saveBtnProps = {
        operation: SAVE_COLUMN_METADATA,
        params: {},
        onClick: this.handleSaveClick,
        forceDisable: !view.columnFormDirty
      };
    }

    return (
      <div className={styles.manageMetadata}>
        <Modal fullScreen onDismiss={this.handleCancelClick}>
          <ModalHeader title={I18n.metadata_manage.title} onDismiss={this.handleCancelClick} />

          <ModalContent>
            <MetadataContent {...metadataContentProps} />
          </ModalContent>

          <ModalFooter>
            <button id="cancel" className={styles.button} onClick={this.handleCancelClick}>
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
  view: PropTypes.object.isRequired,
  fourfour: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  columnsExist: PropTypes.bool,
  currentColumns: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired
};

const mapStateToProps = ({ entities, ui }, ownProps) => ({
  fourfour: ui.routing.fourfour,
  view: entities.views[ui.routing.fourfour],
  path: ownProps.route.path,
  columnsExist: !_.isEmpty(entities.output_columns),
  currentColumns: _.chain(entities).thru(getCurrentColumns).map(restoreColumn).keyBy('id').value()
});

function restoreColumn(col) {
  return _.omit(col, ['transform']);
}

export default connect(mapStateToProps)(ManageMetadata);
