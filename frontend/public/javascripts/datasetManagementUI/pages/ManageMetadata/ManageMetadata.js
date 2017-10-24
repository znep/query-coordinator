import PropTypes from 'prop-types';
import React, { Component } from 'react';
import _ from 'lodash';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'common/components';
import { editRevision } from 'reduxStuff/actions/revisions';
import { addOutputColumns } from 'reduxStuff/actions/outputColumns';
import {
  dismissMetadataPane,
  saveDatasetMetadata,
  saveColumnMetadata
} from 'reduxStuff/actions/manageMetadata';
import { hideFlashMessage, showFlashMessage } from 'reduxStuff/actions/flashMessage';
import { markFormClean, showFormErrors, appendFormError } from 'reduxStuff/actions/forms';
import { SAVE_DATASET_METADATA, SAVE_COLUMN_METADATA } from 'reduxStuff/actions/apiCalls';
import ApiCallButton from 'containers/ApiCallButtonContainer';
import MetadataContent from 'components/MetadataContent/MetadataContent';
import * as Selectors from 'selectors';
import * as Links from 'links/links';
import { connect } from 'react-redux';
import { getCurrentColumns, classify } from 'models/forms';
import styles from './ManageMetadata.scss';

export class ManageMetadata extends Component {
  constructor() {
    super();
    this.state = {
      initialRevision: null,
      initialColMetadata: null
    };

    _.bindAll(this, ['revertChanges', 'handleSaveClick', 'handleCancelClick', 'handleTabClick']);
  }

  componentWillMount() {
    const { revision, currentColumns } = this.props;

    this.setState({
      initialRevision: {
        metadata: Selectors.datasetMetadata(revision.metadata),
        attachments: revision.attachments
      },

      initialColMetadata: currentColumns
    });
  }

  onDatasetTab() {
    return this.props.path === 'metadata/dataset';
  }

  revertChanges() {
    const { dispatch, revision } = this.props;

    // The metadata forms connect directly to the store, so if the user clicks
    // cancel, we want to reset the data in the store back to what it was when
    // this component first mounted (which we've cached in the local state here)
    dispatch(
      editRevision(revision.id, this.state.initialRevision)
    );

    dispatch(markFormClean('datasetForm'));
    dispatch(markFormClean('columnForm'));
    dispatch(addOutputColumns(this.state.initialColMetadata));
  }

  handleSaveClick(e) {
    e.preventDefault();

    const {
      dispatch,
      revision,
      currentColumns,
      outputSchemaId,
      datasetFormDirty,
      columnFormDirty,
      params
    } = this.props;

    if (this.onDatasetTab() && datasetFormDirty) {
      dispatch(saveDatasetMetadata(revision, params))
        .then(() => {
          this.setState({
            initialRevision: {
              metadata: Selectors.datasetMetadata(revision.metadata),
              attachments: revision.attachments
            }
          });
        })
        .catch(error => {
          // dispatch(apiCallFailed(callId, error));
          error.response.json().then(err => {
            dispatch(showFormErrors('datasetForm'));
            dispatch(showFlashMessage('error', I18n.edit_metadata.validation_error_general));
            const failure = classify(err.reason);
            if (failure && failure.fieldName && failure.fieldset) {
              dispatch(appendFormError('datasetForm', failure));
            }
          });
        });
    } else if (columnFormDirty) {
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
    const { dispatch, params, datasetFormDirty, columnFormDirty } = this.props;

    if (datasetFormDirty || columnFormDirty) {
      this.revertChanges();
    }

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
    const { dispatch } = this.props;

    dispatch(hideFlashMessage());
    dispatch(showFormErrors('datasetForm'));
    dispatch(showFormErrors('columnForm'));
  }

  render() {
    const { columnsExist, outputSchemaId, datasetFormDirty, columnFormDirty, params } = this.props;

    const metadataContentProps = {
      onDatasetTab: this.onDatasetTab(),
      params,
      onSidebarTabClick: this.handleTabClick,
      columnsExist,
      outputSchemaId
    };

    let saveBtnProps;
    let cancelWord = I18n.common.cancel;

    if (this.onDatasetTab()) {
      saveBtnProps = {
        operation: SAVE_DATASET_METADATA,
        params: {},
        onClick: this.handleSaveClick,
        forceDisable: !datasetFormDirty
      };

      cancelWord = datasetFormDirty ? I18n.common.cancel : I18n.common.done;
    } else {
      saveBtnProps = {
        operation: SAVE_COLUMN_METADATA,
        params: {},
        onClick: this.handleSaveClick,
        forceDisable: !columnFormDirty
      };

      cancelWord = columnFormDirty ? I18n.common.cancel : I18n.common.done;
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
              {cancelWord}
            </button>
            <ApiCallButton {...saveBtnProps} />
          </ModalFooter>
        </Modal>
      </div>
    );
  }
}

ManageMetadata.propTypes = {
  revision: PropTypes.object.isRequired,
  datasetFormDirty: PropTypes.bool.isRequired,
  columnFormDirty: PropTypes.bool.isRequired,
  path: PropTypes.string.isRequired,
  columnsExist: PropTypes.bool,
  currentColumns: PropTypes.object.isRequired,
  entities: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
  outputSchemaId: PropTypes.number
};

const mapStateToProps = ({ entities, ui }, ownProps) => {
  let outputSchemaId;

  const revision = _.find(
    entities.revisions,
    r => r.revision_seq === _.toNumber(ownProps.params.revisionSeq)
  );

  if (ownProps.params.outputSchemaId) {
    outputSchemaId = _.toNumber(ownProps.params.outputSchemaId);
  } else if (revision && revision.output_schema_id) {
    outputSchemaId = revision.output_schema_id;
  } else {
    const os = Selectors.currentOutputSchema(entities, _.toNumber(ownProps.params.revisionSeq));
    outputSchemaId = os ? os.id : null;
  }

  return {
    path: ownProps.route.path,
    datasetFormDirty: ui.forms.datasetForm.isDirty,
    columnFormDirty: ui.forms.columnForm.isDirty,
    columnsExist: !_.isEmpty(entities.output_columns),
    outputSchemaId,
    revision,
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
