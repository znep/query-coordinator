import PropTypes from 'prop-types';
import React, { Component } from 'react';
import _ from 'lodash';
import BackButton from '../BackButton';
import ExternalResourceForm from './ExternalResourceForm';
import { ExternalViewCard, Modal, ModalHeader, ModalContent, ModalFooter } from 'common/components';
import { VALID_URL_REGEX } from 'common/http/constants';

import './styles/index.scss';

export class ExternalResourceEditor extends Component {
  constructor(props) {
    super(props);

    this.initialState = null;
    this.state = { title: '', description: '', url: '', previewImage: '' };

    _.bindAll(this, [
      'isDirty',
      'isUrlValid',
      'isDisabled',
      'updateField',
      'returnExternalResource',
      'renderModalContent',
      'renderFooterContent'
    ]);
  }

  componentWillReceiveProps(newProps) {
    if (newProps.featuredContentItem) {
      const { name, description, url, imageUrl } = newProps.featuredContentItem;
      if (!this.initialState) {
        this.initialState = { title: name, description, url, previewImage: imageUrl };
      }
      this.setState({ description, previewImage: imageUrl, title: name, url });
    }
  }

  isDirty() {
    return !_.isEqual(this.initialState, this.state);
  }

  isUrlValid() {
    return VALID_URL_REGEX.test(this.state.url);
  }

  isDisabled() {
    return !this.isDirty() || _.isEmpty(this.state.title) || !this.isUrlValid();
  }

  updateField(field, value) {
    this.setState({ [field]: value });
  }

  returnExternalResource() {
    const { title, description, url, previewImage } = this.state;
    const { onClose, onSelect } = this.props;

    if (this.isDisabled()) {
      return;
    }

    const result = {
      contentType: 'external',
      name: title,
      description,
      url,
      imageUrl: previewImage
    };
    onSelect(result);
    onClose();
  }

  renderModalContent() {
    const { title, description, url, previewImage } = this.state;
    const { onBack } = this.props;

    const showUrlWarning = !_.isEmpty(this.state.url) && !this.isUrlValid();
    const urlWarning = showUrlWarning ? (
      <div className="alert error url-warning">
        {_.get(I18n, 'common.external_resource_editor.form.fields.url.error')}
      </div>) : null;

    const externalResourceFormProps = {
      description,
      onEnter: this.returnExternalResource,
      onFieldChange: this.updateField,
      previewImage,
      title,
      url,
      urlWarning
    };

    const previewCardProps = {
      name: title,
      description,
      imageUrl: previewImage,
      previewImage,
      linkProps: {
        'aria-label': _.get(I18n, 'common.external_resource_editor.preview')
      }
    };

    return (
      <div className="centered-content">
        <BackButton onClick={onBack} />

        <div className="description">
          <strong>{_.get(I18n, 'common.external_resource_editor.form.description.create_a_link')}</strong>
          <div>{_.get(I18n, 'common.external_resource_editor.form.description.for_example')}</div>
        </div>

        <div className="external-resource-contents">
          <ExternalResourceForm {...externalResourceFormProps} />

          <div className="external-resource-preview">
            <ExternalViewCard {...previewCardProps} />
          </div>
        </div>
      </div>
    );
  }

  renderFooterContent() {
    const { onClose } = this.props;

    return (
      <div>
        <button
          key="cancel"
          className="btn btn-default btn-sm cancel-button"
          onClick={onClose}>
          {_.get(I18n, 'common.external_resource_editor.footer.cancel')}
        </button>
        <button
          key="select"
          className="btn btn-sm btn-primary select-button"
          disabled={this.isDisabled()}
          onClick={this.returnExternalResource}>
          {_.get(I18n, 'common.external_resource_editor.footer.select')}
        </button>
      </div>
    );
  }

  render() {
    const { onClose, modalIsOpen } = this.props;

    if (!modalIsOpen) {
      return null;
    }

    const modalProps = {
      className: 'external-resource-editor',
      fullScreen: true,
      onDismiss: onClose,
      overlay: true
    };

    const modalTitle = _.get(I18n, 'common.external_resource_editor.header_title');

    return (
      <Modal {...modalProps}>
        <ModalHeader title={modalTitle} onDismiss={onClose} />
        <ModalContent>{this.renderModalContent()}</ModalContent>
        <ModalFooter>{this.renderFooterContent()}</ModalFooter>
      </Modal>
    );
  }
}

ExternalResourceEditor.propTypes = {
  featuredContentItem: PropTypes.object,
  modalIsOpen: PropTypes.bool.isRequired,
  onBack: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired
};

ExternalResourceEditor.defaultProps = {
  modalIsOpen: false,
  onBack: _.noop,
  onClose: _.noop,
  onSelect: _.noop
};

export default ExternalResourceEditor;
