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
      description: description,
      url: url,
      imageUrl: previewImage
    };
    this.props.onSelect(result);
    this.props.onClose();
  }

  render() {
    const { title, description, url, previewImage } = this.state;
    const { onClose, modalIsOpen } = this.props;

    const previewCardProps = {
      name: _.isEmpty(title) ? null : title,
      description: _.isEmpty(description) ? null : description,
      imageUrl: _.isEmpty(previewImage) ? null : previewImage,
      linkProps: {
        'aria-label': _.get(I18n, 'external_resource_wizard.preview', 'Preview')
      }
    };

    const formIsInvalid = _.isEmpty(title) || _.isEmpty(url);
    const footerChildren = (
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
      children: [
        <div key={0}>
          <ModalHeader
            title={_.get(I18n, 'external_resource_wizard.header_title', 'Feature an External Resource')}
            onDismiss={onClose} />
          <ModalContent>
            <div className="centered-content">
              <BackButton onClick={onClose} />

              <div className="description">
                <p>
                  <strong>{_.get(I18n, 'external_resource_wizard.form.description.create_a_link')}</strong>
                  <br />
                  {_.get(I18n, 'external_resource_wizard.form.description.for_example')}
                </p>
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
          </ModalContent>
          <ModalFooter children={footerChildren} />
        </div>
      ],
      className: 'external-resource-wizard',
      fullScreen: true,
      onDismiss: onClose,
      overlay: true
    };

    return modalIsOpen ? <Modal {...modalProps} /> : null;
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
