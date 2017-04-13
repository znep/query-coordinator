import React, { PropTypes } from 'react';
import _ from 'lodash';
import { push } from 'react-router-redux';
import { connect } from 'react-redux';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'socrata-components';

import * as Links from 'links';
import { saveDatasetMetadata, saveColumnMetadata } from 'actions/manageMetadata';
import { hideFlashMessage } from 'actions/flashMessage';
import { edit } from 'actions/database';
import { STATUS_UPDATING, STATUS_UPSERTING } from 'lib/database/statuses';
import SaveButton from 'components/ManageMetadata/SaveButton';
import MetadataContent from 'components/ManageMetadata/MetadataContent';
import styles from 'styles/ManageMetadata/ManageMetadata.scss';

export function ManageMetadata(props) {
  const {
    views,
    fourfour,
    path,
    onDismiss,
    onSaveDataset,
    onSaveCol,
    onSidebarTabClick,
    outputSchemaStatus
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

  const metadataContentProps = { path, fourfour, onSidebarTabClick };

  const onDatasetTab = path === 'metadata/dataset';

  let saveBtnProps;

  if (onDatasetTab) {
    saveBtnProps = {
      isSaving: view.__status__ && view.__status__.type === STATUS_UPDATING,
      isDirty: _.get(view, 'isDirty.form', false),
      onSaveClick: onSaveDataset
    };
  } else {
    saveBtnProps = {
      isDirty: _.get(view, 'colFormIsDirty.form', false),
      onSaveClick: onSaveCol,
      isSaving: outputSchemaStatus && outputSchemaStatus === STATUS_UPSERTING
    };
  }

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
  onSaveDataset: PropTypes.func.isRequired,
  onSaveCol: PropTypes.func.isRequired,
  onSidebarTabClick: PropTypes.func,
  views: PropTypes.object.isRequired,
  fourfour: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  outputSchemaStatus: PropTypes.string
};

const mapDispatchToProps = (dispatch, ownProps) => ({
  onDismiss: () => {
    dispatch(push(Links.home(ownProps.location)));
  },
  onSaveDataset: () => dispatch(saveDatasetMetadata()),
  onSaveCol: () => dispatch(saveColumnMetadata()),
  onSidebarTabClick: (fourfour) => {
    dispatch(hideFlashMessage());

    dispatch(edit('views', {
      id: fourfour,
      displayMetadataFieldErrors: false
    }));
  }
});

// TODO: should prob get url stuff from redux store or rr props but not both
const mapStateToProps = (state, ownProps) => ({
  views: _.get(state, 'db.views', {}),
  fourfour: state.fourfour,
  path: ownProps.route.path,
  outputSchemaStatus: state.db.output_schemas.__status__
});

export default connect(mapStateToProps, mapDispatchToProps)(ManageMetadata);