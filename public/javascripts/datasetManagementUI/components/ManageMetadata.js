import _ from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { Modal, ModalHeader, ModalFooter, ModalContent } from 'socrata-components';
import { bindActionCreators } from 'redux';
import MetadataField from './MetadataField';
import { saveMetadata, updateMetadata, closeMetadataModal } from '../actions/manageMetadata';

export function ManageMetadata({ onDismiss, onChange, onSave, metadata }) {

  if (!metadata.modalOpen) {
    return null;
  }

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
      onChange: _.partial(onChange, descriptor.key),
      descriptor,
      value: _.defaultTo(metadata[descriptor.key], descriptor.defaultValue)
    };
    return <MetadataField key={descriptor.key} {...fieldProps} />;
  });

  return (
    <Modal {...modalProps} >
      <ModalHeader {...headerProps} />

      <ModalContent>
        <section className="modal-content">
          {generalFieldsHtml}
        </section>
      </ModalContent>

      <ModalFooter>
        <div className="modal-footer-actions">
          <button id="cancel" className="btn btn-default" onClick={onDismiss}>
            {I18n.common.cancel}
          </button>
          <button id="save" className="btn btn-primary" onClick={onSave}>
            {I18n.common.save}
          </button>
        </div>
      </ModalFooter>
    </Modal>
  );
}

ManageMetadata.propTypes = {
  onDismiss: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  metadata: PropTypes.object.isRequired
};

function mapStateToProps(state) {
  return _.pick(state, 'metadata');
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onChange: updateMetadata,
    onSave: saveMetadata,
    onDismiss: closeMetadataModal
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ManageMetadata);
