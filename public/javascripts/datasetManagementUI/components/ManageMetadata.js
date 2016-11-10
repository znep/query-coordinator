import _ from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import MetadataField from './MetadataField';
import { saveMetadata, updateMetadata } from '../actions/manageMetadata';

export function ManageMetadata({ metadata, onChange, onSave }) {
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
    <div
      id="manage-metadata-modal"
      className="modal modal-full modal-overlay modal-hidden"
      data-modal-dismiss>
      <div className="modal-container">
        <header className="modal-header">
          <h1 className="modal-header-title">{I18n.home_pane.metadata}</h1>
          <button className="btn btn-transparent modal-header-dismiss" data-modal-dismiss>
            <span className="icon-close-2" aria-label={I18n.common.cancel}></span>
          </button>
        </header>

        <section className="modal-content">
          <form>
            {generalFieldsHtml}
          </form>
        </section>

        <footer className="modal-footer">
          <div className="modal-footer-actions">
            <button className="btn btn-default" data-modal-dismiss>{I18n.common.cancel}</button>
            <button
              className="btn btn-primary"
              onClick={onSave}
              data-modal-dismiss>
              {I18n.common.save}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

ManageMetadata.propTypes = {
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
    onSave: saveMetadata
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ManageMetadata);
