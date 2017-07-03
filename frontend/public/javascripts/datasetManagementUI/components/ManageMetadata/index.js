import React, { PropTypes } from 'react';
import _ from 'lodash';
import { connect } from 'react-redux';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'common/components';
import { editView } from 'actions/views';
import { dismissMetadataPane, saveDatasetMetadata, saveColumnMetadata } from 'actions/manageMetadata';
import { hideFlashMessage } from 'actions/flashMessage';
import { SAVE_DATASET_METADATA, SAVE_COLUMN_METADATA } from 'actions/apiCalls';
import ApiCallButton from 'components/ApiCallButton';
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
    columnsExist,
    onSidebarTabClick
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
      onClick: _.get(view, 'colFormIsDirty.form', false) ? onSaveCol : onDismiss
    };
  }

  return (
    <div className={styles.manageMetadata}>
      <Modal {...modalProps}>
        <ModalHeader {...headerProps} />

        <ModalContent>
          <MetadataContent {...metadataContentProps} />
        </ModalContent>

        <ModalFooter>
          <button id="cancel" className={styles.button} onClick={onDismiss}>
            {I18n.common.cancel}
          </button>
          <ApiCallButton {...saveBtnProps} />
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
  columnsExist: PropTypes.bool
};

const mapDispatchToProps = dispatch => ({
  onDismiss: () => dispatch(dismissMetadataPane()),
  onSaveDataset: () => dispatch(saveDatasetMetadata()),
  onSaveCol: () => dispatch(saveColumnMetadata()),
  onSidebarTabClick: fourfour => {
    dispatch(hideFlashMessage());

    dispatch(editView(fourfour, { displayMetadataFieldErrors: true }));
  }
});

const mapStateToProps = ({ entities, ui }, ownProps) => ({
  views: entities.views,
  fourfour: ui.routing.fourfour,
  path: ownProps.route.path,
  columnsExist: !_.isEmpty(entities.output_columns)
});

export default connect(mapStateToProps, mapDispatchToProps)(ManageMetadata);
