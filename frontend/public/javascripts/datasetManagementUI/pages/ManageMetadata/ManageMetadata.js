import React, { PropTypes, Component } from 'react';
import _ from 'lodash';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'common/components';
import { editView } from 'actions/views';
import { addOutputColumns } from 'actions/outputColumns';
import { dismissMetadataPane, saveDatasetMetadata, saveColumnMetadata } from 'actions/manageMetadata';
import { hideFlashMessage } from 'actions/flashMessage';
import { SAVE_DATASET_METADATA, SAVE_COLUMN_METADATA } from 'actions/apiCalls';
import ApiCallButton from 'containers/ApiCallButtonContainer';
import MetadataContent from 'containers/MetadataContentContainer';
import * as Selectors from 'selectors';
import * as Links from 'links';
import { connect } from 'react-redux';
import { getCurrentColumns } from 'models/forms';
import styles from './ManageMetadata.scss';

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
      initialDatasetMetadata: Selectors.datasetMetadata(view),
      initialColMetadata: currentColumns
    });
  }

  onDatasetTab() {
    return this.props.path === 'metadata/dataset';
  }

  revertChanges() {
    const { dispatch, params } = this.props;

    // The metadata forms connect directly to the store, so if the user clicks
    // cancel, we want to reset the data in the store back to what it was when
    // this component first mounted (which we've cached in the local state here)
    dispatch(
      editView(params.fourfour, {
        ...this.state.initialDatasetMetadata,
        columnFormDirty: false,
        datasetFormDirty: false
      })
    );

    dispatch(addOutputColumns(this.state.initialColMetadata));
  }

  handleSaveClick(e) {
    e.preventDefault();

    const { dispatch, view, currentColumns, outputSchemaId, params } = this.props;

    if (this.onDatasetTab() && view.datasetFormDirty) {
      dispatch(saveDatasetMetadata(params.fourfour))
        .then(() => {
          this.setState({
            initialDatasetMetadata: Selectors.datasetMetadata(view)
          });
        })
        .catch(() => console.warn('Save failed'));
    } else if (view.columnFormDirty) {
      dispatch(saveColumnMetadata(outputSchemaId, params))
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
    const { dispatch, params } = this.props;

    this.revertChanges();

    let path;
    if (!this.onDatasetTab()) {
      const { source, inputSchema, outputSchema } = Selectors.treeForOutputSchema(
        this.props.entities,
        this.props.outputSchemaId
      );
      path = Links.showOutputSchema(params, source.id, inputSchema.id, outputSchema.id);
    }

    dispatch(dismissMetadataPane(path, params));
  }

  handleTabClick() {
    const { dispatch, params } = this.props;

    dispatch(hideFlashMessage());

    dispatch(editView(params.fourfour, { showErrors: true }));
  }

  render() {
    const { columnsExist, view, outputSchemaId, params } = this.props;

    const metadataContentProps = {
      onDatasetTab: this.onDatasetTab(),
      params,
      onSidebarTabClick: this.handleTabClick,
      columnsExist,
      outputSchemaId
    };

    let saveBtnProps;

    if (this.onDatasetTab()) {
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
  path: PropTypes.string.isRequired,
  columnsExist: PropTypes.bool,
  currentColumns: PropTypes.object.isRequired,
  entities: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
  outputSchemaId: PropTypes.number.isRequired
};

const mapStateToProps = ({ entities }, ownProps) => {
  const outputSchemaId = parseInt(ownProps.params.outputSchemaId, 10);
  return {
    view: entities.views[ownProps.params.fourfour],
    path: ownProps.route.path,
    params: ownProps.params,
    columnsExist: !_.isEmpty(entities.output_columns),
    outputSchemaId,
    entities: entities,
    currentColumns: _.chain(getCurrentColumns(outputSchemaId, entities))
      .map(restoreColumn)
      .keyBy('id')
      .value()
  };
};

function restoreColumn(col) {
  return _.omit(col, ['transform']);
}

export default connect(mapStateToProps)(ManageMetadata);
