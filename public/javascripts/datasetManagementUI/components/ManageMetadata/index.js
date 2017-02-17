import React, { PropTypes } from 'react';
import { push } from 'react-router-redux';
import { connect } from 'react-redux';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'socrata-components';
import { edit, editImmutable } from '../../actions/database';
import * as Actions from '../../actions/manageMetadata';
import * as Links from '../../links';
import SaveButton from './SaveButton';
import MetadataContent from './MetadataContent';
import * as Selectors from '../../selectors';

export function ManageMetadata({ view, outputSchema, outputColumns, path,
                                 onDismiss, onEditDatasetMetadata, onEditColumnMetadata, onSave }) {
  const modalProps = {
    fullScreen: true,
    onDismiss
  };

  const headerProps = {
    title: I18n.metadata_manage.title.format(view.name),
    onDismiss
  };

  const metadataContentProps = { path, view, onEditDatasetMetadata, onEditColumnMetadata };
  const saveProps = { onSave, view, outputSchema, outputColumns };

  return (
    <div id="manage-metadata">
      <Modal {...modalProps} >
        <ModalHeader {...headerProps} />

        <ModalContent>
          <MetadataContent {...metadataContentProps} />
        </ModalContent>

        <ModalFooter>
          <button id="cancel" className="btn btn-default" onClick={onDismiss}>
            {I18n.common.cancel}
          </button>
          <SaveButton {...saveProps} />
        </ModalFooter>
      </Modal>
    </div>
  );
}

ManageMetadata.propTypes = {
  onDismiss: PropTypes.func.isRequired,
  onEditDatasetMetadata: PropTypes.func.isRequired,
  onEditColumnMetadata: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  view: PropTypes.object.isRequired,
  outputSchema: PropTypes.object.isRequired,
  outputColumns: PropTypes.array.isRequired,
  path: PropTypes.string.isRequired
};

function mapDispatchToProps(dispatch, ownProps) {
  return {
    onSave: () => { dispatch(Actions.saveMetadata()); },
    onEditDatasetMetadata: (tableName, edits) => { dispatch(edit(tableName, edits)); },
    onEditColumnMetadata: (tableName, edits) => { dispatch(editImmutable(tableName, edits)); },
    onDismiss: () => {
      dispatch(push(Links.home(ownProps.location)));
    }
  };
}

const mapStateToProps = (state, ownProps) => {
  const currentOutputSchema = Selectors.currentOutputSchema(state.db);
  return {
    view: state.db.views[0],
    outputSchema: currentOutputSchema,
    outputColumns: currentOutputSchema ?
      Selectors.columnsForOutputSchema(state.db, currentOutputSchema.id) :
      [],
    path: ownProps.route.path
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ManageMetadata);
