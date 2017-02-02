import React, { Component, PropTypes } from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import BackButton from '../../assetSelector/components/BackButton';
import Header from '../../assetSelector/components/Header';
import ExternalResourceForm from './ExternalResourceForm';
import Footer from './Footer';
import { ExternalViewCard } from 'socrata-components';

export class ExternalResourceWizard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      title: '',
      description: '',
      url: '',
      previewImage: ''
    };

    _.bindAll(this, ['returnExternalResource', 'updateField']);
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

    const modalClassNames = classNames({
      'external-resource-wizard': true,
      'modal': true,
      'modal-full': true,
      'modal-hidden': !this.props.modalIsOpen
    });

    const previewCardProps = {
      name: _.isEmpty(title) ? null : title,
      description: _.isEmpty(description) ? null : description,
      imageUrl: _.isEmpty(previewImage) ? null : previewImage,
      linkProps: {
        'aria-label': _.get(I18n, 'external_resource_wizard.preview', 'Preview')
      }
    };

    const formIsInvalid = _.isEmpty(title) || _.isEmpty(url);

    return (
      <div className={modalClassNames} data-modal-dismiss>
        <div className="modal-container">
          <Header
            title={_.get(I18n, 'external_resource_wizard.header_title', 'Feature an External Resource')} />
          <div className="modal-content">
            <div className="centered-content">
              <BackButton onClick={this.props.onClose} />

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
          </div>
          <Footer
            onClose={this.props.onClose}
            onSelect={this.returnExternalResource}
            selectIsDisabled={formIsInvalid} />
        </div>
      </div>
    );
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
