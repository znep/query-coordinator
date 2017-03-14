import React, { PropTypes } from 'react';
import _ from 'lodash';
import BackButton from '../BackButton';
import ExternalResourceForm from './ExternalResourceForm';
import { ExternalViewCard, Modal, ModalHeader, ModalContent, ModalFooter } from 'socrata-components';

export class ExternalResourceEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = { title: '', description: '', url: '', previewImage: '' };

    _.bindAll(this, [
      'updateField',
      'returnExternalResource',
      'renderModalContent',
      'renderFooterContent'
    ]);
  }

  updateField(field, value) {
    this.setState({ [field]: value });
  }

  returnExternalResource() {
    const { title, description, url, previewImage } = this.state;
    const { onClose, onSelect } = this.props;

    const result = {
      resourceType: 'external',
      name: title,
      description,
      url,
      imageUrl: previewImage
    };
    onSelect(result);
    onClose();
    this.setState({ title: '', description: '', url: '', previewImage: '' });
  }

  renderModalContent() {
    const { title, description, url, previewImage } = this.state;
    const { onBack } = this.props;

    const externalResourceFormProps = {
      description,
      onFieldChange: this.updateField,
      previewImage,
      title,
      url
    };

    const previewCardProps = {
      name: title,
      description,
      imageUrl: previewImage,
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
    const { title, url } = this.state;
    const formIsInvalid = _.isEmpty(title) || _.isEmpty(url);

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
          disabled={formIsInvalid}
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
