import React, { PropTypes } from 'react';
import _ from 'lodash';
import { push, goBack } from 'react-router-redux';
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
    history,
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

  let lastVisited;

  // We only keep current location and previous location, and the code that stores
  // these lives only in DSMUI. This means that if you came from another site, there
  // will be only one location in history (the current one). If there is more than one,
  // then we know that the first one is from DSMUI.
  if (history.length > 1) {
    lastVisited = history[0];
  }

  const headerProps = {
    title: I18n.metadata_manage.title,
    onDismiss: () => onDismiss(lastVisited)
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
          <button
            id="cancel"
            className={styles.button}
            onClick={() => onDismiss(lastVisited)}>
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
  outputSchemaStatus: PropTypes.string,
  history: PropTypes.arrayOf(PropTypes.shape({
    pathname: PropTypes.string
  }))
};

const mapDispatchToProps = (dispatch, ownProps) => ({
  onDismiss: previousLocation => {
    if (previousLocation) {
      dispatch(goBack());
    } else {
      dispatch(push(Links.home(ownProps.location)));
    }
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

const mapStateToProps = (state, ownProps) => ({
  views: _.get(state, 'db.views', {}),
  fourfour: state.routing.fourfour,
  history: state.routing.history,
  path: ownProps.route.path,
  outputSchemaStatus: state.db.output_schemas.__status__
});

export default connect(mapStateToProps, mapDispatchToProps)(ManageMetadata);
