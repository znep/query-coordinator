import React, { PropTypes } from 'react';
import _ from 'lodash';
import { push } from 'react-router-redux';
import { connect } from 'react-redux';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'socrata-components';

import * as Links from 'links';
import * as Selectors from 'selectors';
import { editImmutable } from 'actions/database';
import { saveDatasetMetadata } from 'actions/manageMetadata';
import SaveButton from 'components/ManageMetadata/SaveButton';
import MetadataContent from 'components/ManageMetadata/MetadataContent';
import styles from 'styles/ManageMetadata/ManageMetadata.scss';

export function ManageMetadata(props) {
  const {
    views,
    fourfour,
    path,
    onDismiss,
    onSave,
    onEditColumnMetadata
  } = props;

  const view = _.get(views, fourfour, {});

  const modalProps = {
    fullScreen: true,
    onDismiss
  };

  const headerProps = {
    title: I18n.metadata_manage.title,
    onDismiss
  };

  const metadataContentProps = { path, view, onEditColumnMetadata };

  const saveBtnProps = {
    isDirty: _.get(view, 'isDirty', {}),
    onSaveClick: onSave
  };

  return (
    <div className={styles.manageMetadata}>
      <Modal {...modalProps} >
        <ModalHeader {...headerProps} />

        <ModalContent>
          <MetadataContent {...metadataContentProps} />
        </ModalContent>

        <ModalFooter>
          <button id="cancel" className={styles.button} onClick={onDismiss}>
            {I18n.common.cancel}
          </button>
          <SaveButton {...saveBtnProps} />
        </ModalFooter>
      </Modal>
    </div>
  );
}

ManageMetadata.propTypes = {
  onDismiss: PropTypes.func.isRequired,
  onEditColumnMetadata: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  views: PropTypes.object.isRequired,
  fourfour: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired
};

const mapDispatchToProps = (dispatch, ownProps) => ({
  onEditColumnMetadata: (tableName, edits) => { dispatch(editImmutable(tableName, edits)); },
  onDismiss: () => {
    dispatch(push(Links.home(ownProps.location)));
  },
  onSave: () => dispatch(saveDatasetMetadata())
});

// TODO: should prob get url stuff from redux store or rr props but not both
const mapStateToProps = (state, ownProps) => {
  const currentOutputSchema = Selectors.latestOutputSchema(state.db);
  return {
    views: _.get(state, 'db.views', {}),
    fourfour: state.fourfour,
    outputSchema: currentOutputSchema,
    outputColumns: currentOutputSchema
      ? Selectors.columnsForOutputSchema(state.db, currentOutputSchema.id)
      : [],
    path: ownProps.route.path
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ManageMetadata);
