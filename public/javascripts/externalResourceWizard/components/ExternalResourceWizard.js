import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import classNames from 'classnames';
import { closeExternalResourceWizard } from '../actions/modal';
import { updateTitle, updateDescription, updateUrl, updatePreviewImage } from '../actions/content';
import BackButton from '../../assetSelector/components/BackButton';
import Header from '../../assetSelector/components/Header';
import ExternalResourceForm from './ExternalResourceForm';
import Footer from './Footer';
import { ExternalViewCard } from 'socrata-components';

export class ExternalResourceWizard extends Component {
  constructor(props) {
    super(props);
    _.bindAll(this, ['returnExternalResource']);
  }

  returnExternalResource() {
    const result = {
      resourceType: 'external',
      title: this.props.title,
      description: this.props.description,
      url: this.props.url,
      previewImage: this.props.previewImage
    };
    console.log(result); // TODO: provide this for parent component
    this.props.dispatchCloseExternalResourceWizard();
    this.props.dispatchClearFormValues();
  }

  render() {
    const { title, description, url, previewImage } = this.props;

    const modalClassNames = classNames({
      'external-resource-wizard': true,
      'modal': true,
      'modal-full': true,
      'modal-hidden': !this.props.modalIsOpen
    });

    const previewCardProps = {
      name: _.isEmpty(title.value) ? null : title.value,
      description: _.isEmpty(description.value) ? null : description.value,
      imageUrl: _.isEmpty(previewImage.value) ? null : previewImage.value,
      linkProps: {
        'aria-label': _.get(I18n, 'external_resource_wizard.preview', 'Preview')
      }
    };

    const formIsInvalid = !_.isEmpty(_.find([title, description, url, previewImage], { invalid: true }));

    return (
      <div className={modalClassNames} data-modal-dismiss>
        <div className="modal-container">
          <Header
            title={_.get(I18n, 'external_resource_wizard.header_title', 'Feature an External Resource')} />
          <div className="modal-content">
            <div className="centered-content">
              <BackButton
                onClick={() => {
                  this.props.dispatchCloseExternalResourceWizard();
                  this.props.onDismiss();
                }} />

              <div className="description">
                <p>
                  <strong>{_.get(I18n, 'external_resource_wizard.form.description.create_a_link')}</strong>
                  <br />
                  {_.get(I18n, 'external_resource_wizard.form.description.for_example')}
                </p>
              </div>

              <div className="external-resource-contents">
                <ExternalResourceForm
                  title={title}
                  description={description}
                  url={url}
                  previewImage={previewImage} />

                <div className="external-resource-preview">
                  <ExternalViewCard {...previewCardProps} />
                </div>
              </div>
            </div>
          </div>
          <Footer
            onSelect={this.returnExternalResource}
            selectIsDisabled={formIsInvalid} />
        </div>
      </div>
    );
  }
}

ExternalResourceWizard.propTypes = {
  dispatchCloseExternalResourceWizard: PropTypes.func.isRequired,
  dispatchClearFormValues: PropTypes.func.isRequired,
  modalIsOpen: PropTypes.bool.isRequired,
  onDismiss: PropTypes.func,
  title: PropTypes.object.isRequired,
  description: PropTypes.object.isRequired,
  url: PropTypes.object.isRequired,
  previewImage: PropTypes.object.isRequired
};

ExternalResourceWizard.defaultProps = {
  dispatchCloseExternalResourceWizard: _.noop,
  dispatchClearFormValues: _.noop,
  modalIsOpen: false,
  onDismiss: _.noop,
  title: {
    value: '',
    invalid: true
  },
  description: {
    value: ''
  },
  url: {
    value: '',
    invalid: true
  },
  previewImage: {
    value: ''
  }
};

function mapStateToProps(state) {
  return {
    modalIsOpen: _.get(state, 'externalResourceWizard.modal.modalIsOpen'),
    title: _.get(state, 'externalResourceWizard.content.title'),
    description: _.get(state, 'externalResourceWizard.content.description'),
    url: _.get(state, 'externalResourceWizard.content.url'),
    previewImage: _.get(state, 'externalResourceWizard.content.previewImage')
  };
}

function mapDispatchToProps(dispatch) {
  return {
    dispatchCloseExternalResourceWizard: function() {
      dispatch(closeExternalResourceWizard());
    },
    dispatchClearFormValues: function() {
      dispatch(updateTitle(''));
      dispatch(updateDescription(''));
      dispatch(updateUrl(''));
      dispatch(updatePreviewImage(''));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ExternalResourceWizard);
