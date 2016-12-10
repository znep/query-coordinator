import _ from 'lodash';
import React, { PropTypes } from 'react';
import { push } from 'react-router-redux';
import { connect } from 'react-redux';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'socrata-components';
import { edit } from '../actions/database';
import MetadataField from './MetadataField';
import * as Actions from '../actions/manageMetadata';
import * as Links from '../links';
import {
  STATUS_SAVED,
  STATUS_UPDATING
} from '../lib/database/statuses';


export function ManageMetadata({ onDismiss, onEdit, onSave, view }) {
  const modalProps = {
    fullScreen: true,
    onDismiss
  };

  const headerProps = {
    title: I18n.home_pane.metadata,
    onDismiss
  };

  const generalFields = [
    {
      type: 'text',
      label: I18n.edit_metadata.dataset_title,
      key: 'name',
      required: true,
      validator: (name) => _.trim(name).length > 0,
      errorMsg: I18n.metadata_manage.errors.missing_name,
      placeholder: I18n.edit_metadata.dataset_title,
      defaultValue: ''
    },
    {
      type: 'textarea',
      label: I18n.edit_metadata.brief_description,
      key: 'description',
      required: false,
      validator: _.constant(true),
      placeholder: I18n.edit_metadata.brief_description_prompt,
      defaultValue: ''
    },
    {
      type: 'select',
      label: I18n.edit_metadata.category,
      key: 'category',
      required: false,
      validator: _.constant(true),
      defaultValue: '',
      options: window.initialState.datasetCategories
    }
  ];

  const generalFieldsHtml = generalFields.map((descriptor) => {
    const fieldProps = {
      onChange: (newValue) => {
        onEdit('views', {
          id: view.id,
          [descriptor.key]: newValue
        });
      },
      descriptor,
      value: _.defaultTo(view[descriptor.key], descriptor.defaultValue)
    };
    return <MetadataField key={descriptor.key} {...fieldProps} />;
  });

  return (
    <Modal {...modalProps} >
      <ModalHeader {...headerProps} />

      <ModalContent>
        <form>
          {generalFieldsHtml}
        </form>
      </ModalContent>

      <ModalFooter>
        <div className="modal-footer-actions">
          <button id="cancel" className="btn btn-default" onClick={onDismiss}>
            {I18n.common.cancel}
          </button>
          <SaveButton
            onSave={onSave}
            status={view.__status__} />
        </div>
      </ModalFooter>
    </Modal>
  );
}

ManageMetadata.propTypes = {
  onDismiss: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  view: PropTypes.object.isRequired
};

function mapDispatchToProps(dispatch, ownProps) {
  return {
    onSave: () => { dispatch(Actions.saveMetadata()); },
    onEdit: (tableName, edits) => { dispatch(edit(tableName, edits)); },
    onDismiss: () => {
      dispatch(push(Links.home(ownProps.location)));
    }
  };
}

const mapStateToProps = (state) => ({
  view: state.db.views[0]
});

export default connect(mapStateToProps, mapDispatchToProps)(ManageMetadata);

function SaveButton({ onSave, status }) {
  switch (status.type) {
    case STATUS_SAVED:
      return (
        <button
          id="save"
          className="btn btn-primary btn-success"
          disabled="true">
          {I18n.common.save}
        </button>
      );

    case STATUS_UPDATING:
      return (
        <button
          id="save"
          className="btn btn-primary"
          disabled="true">
          <span className="spinner-default spinner-btn-primary" />
          {I18n.common.save}
        </button>
      );

    default: // STATUS_DIRTY
      return (
        <button
          id="save"
          className="btn btn-primary"
          onClick={onSave}>
          {I18n.common.save}
        </button>
      );
  }
}

SaveButton.propTypes = {
  onSave: PropTypes.func.isRequired,
  status: PropTypes.object.isRequired
};
