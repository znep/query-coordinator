import React, { Component, PropTypes } from 'react';
import _ from 'lodash';
import BackButton from '../../assetSelector/components/BackButton';
import ExternalResourceForm from './ExternalResourceForm';
import { ExternalViewCard, Modal, ModalHeader, ModalContent, ModalFooter } from 'socrata-components';

export class ExternalResourceWizard extends Component {
  constructor(props) {
    super(props);

    this.state = { title: '', description: '', url: '', previewImage: '' };

    _.bindAll(this, ['updateField', 'returnExternalResource']);
  }

  updateField(field, value) {
    this.setState({ [field]: value });
  }

  returnExternalResource() {
    const { title, description, url, previewImage } = this.state;

    const result = {
      resourceType: 'external',
      name: title,
      description,
      url,
      imageUrl: previewImage
    };
    this.props.onSelect(result);
    this.props.onClose();
    this.setState({ title: '', description: '', url: '', previewImage: '' });
  }

  render() {
    const { title, description, url, previewImage } = this.state;
    const { onClose, modalIsOpen } = this.props;

    const modalTitle = _.get(I18n, 'external_resource_wizard.header_title');

    const previewCardProps = {
      name: _.isEmpty(title) ? null : title,
      description: _.isEmpty(description) ? null : description,
      imageUrl: _.isEmpty(previewImage) ? null : previewImage,
      linkProps: {
        'aria-label': _.get(I18n, 'external_resource_wizard.preview', 'Preview')
      }
    };

    const modalContent = (
      <div className="centered-content">
        <BackButton onClick={onClose} />

        <div className="description">
          <strong>{_.get(I18n, 'external_resource_wizard.form.description.create_a_link')}</strong>
          <div>{_.get(I18n, 'external_resource_wizard.form.description.for_example')}</div>
        </div>

        <div className="external-resource-contents">
          <ExternalResourceForm
            description={description}
            onFieldChange={this.updateField}
            previewImage={previewImage}
            title={title}
            url={url} />

          <div className="external-resource-preview">
            <ExternalViewCard {...previewCardProps} />
          </div>
        </div>
      </div>
    );

    const formIsInvalid = _.isEmpty(title) || _.isEmpty(url);
    const footerContent = (
      <div>
        <button
          key="cancel"
          className="btn btn-default btn-sm cancel-button"
          onClick={onClose}>
          {_.get(I18n, 'external_resource_wizard.footer.cancel', 'Cancel')}
        </button>
        <button
          key="select"
          className="btn btn-sm btn-primary select-button"
          disabled={formIsInvalid}
          onClick={this.returnExternalResource}>
          {_.get(I18n, 'external_resource_wizard.footer.select', 'Select')}
        </button>
      </div>
    );

    const modalProps = {
      className: 'external-resource-wizard',
      fullScreen: true,
      onDismiss: onClose,
      overlay: true
    };

    return modalIsOpen ?
      <Modal {...modalProps}>
        <ModalHeader title={modalTitle} onDismiss={onClose} />
        <ModalContent>{modalContent}</ModalContent>
        <ModalFooter>{footerContent}</ModalFooter>
      </Modal>
      : null;
  }
}

ExternalResourceWizard.propTypes = {
  modalIsOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired
};

ExternalResourceWizard.defaultProps = {
  modalIsOpen: false,
  onClose: _.noop,
  onSelect: _.noop
};

export default ExternalResourceWizard;
