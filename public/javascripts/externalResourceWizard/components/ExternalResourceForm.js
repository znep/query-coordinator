import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import $ from 'jquery';
import { updateTitle, updateDescription, updateUrl, updatePreviewImage } from '../actions/content';

export class ExternalResourceForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isImageInvalid: false
    };
    _.bindAll(this, ['onChange', 'renderInputField']);
  }

  // Key is one of 'title', 'description', 'url', or 'previewImage'
  onChange(key, event) {
    if (key === 'title') {
      this.props.dispatchUpdateTitle(event.target.value);
    } else if (key === 'description') {
      this.props.dispatchUpdateDescription(event.target.value);
    } else if (key === 'url') {
      this.props.dispatchUpdateUrl(event.target.value);
    } else if (key === 'previewImage') {
      // Upload image
      const file = event.target.files[0];
      const isFileImage = file && /\.(jpe?g|png|gif)$/i.test(file.name);

      this.setState({
        isImageInvalid: !isFileImage
      });

      if (!isFileImage) {
        return;
      }

      const fileReader = new FileReader();

      fileReader.addEventListener('load', () => {
        this.props.dispatchUpdatePreviewImage(fileReader.result);
      }, false);

      if (file) {
        fileReader.readAsDataURL(file);
      }
    }
  }

  renderInputField(key, inputProps, button = null) {
    const prefix = 'external-resource';
    const value = this.props[key].value;
    const kebabKey = _.kebabCase(key);

    inputProps = _.defaults(inputProps, {
      id: `${prefix}-${kebabKey}`,
      className: `text-input ${kebabKey}`,
      type: 'text',
      'aria-labelledby': `${prefix}-${kebabKey}-label`,
      onChange: (event) => { this.onChange(key, event); }
    });

    if (inputProps.type !== 'file') {
      inputProps.value = value;
    }

    return (
      <div>
        <label
          id={`${prefix}-${kebabKey}-label`}
          htmlFor={`${prefix}-${kebabKey}`}
          className={`block-label label-${kebabKey}`}>
          {_.get(I18n, `external_resource_wizard.form.fields.${_.snakeCase(key)}.label`, kebabKey)}
        </label>

        {button}
        <input {...inputProps} />
      </div>
    );
  }

  render() {
    const titleField = this.renderInputField('title', {
      maxLength: 80,
      'placeholder': _.get(I18n, 'external_resource_wizard.form.fields.title.placeholder', 'Add a title')
    });
    const descriptionField = this.renderInputField('description', {
      maxLength: 160,
      'placeholder': _.get(I18n, 'external_resource_wizard.form.fields.description.placeholder',
        'Add a description (optional)')
    });
    const urlField = this.renderInputField('url', {
      'placeholder': _.get(I18n, 'external_resource_wizard.form.fields.url.placeholder', 'https://example.com')
    });

    const previewImageButton = (
      <button
        className="btn btn-primary"
        aria-labelledby="external-resource-preview-image-label"
        onClick={(e) => {
          e.preventDefault();
          $('.preview-image').click();
        }}>
        {_.get(I18n, 'external_resource_wizard.form.fields.preview_image.button_text', 'Choose an image')}
      </button>
    );
    const previewImageField = this.renderInputField('previewImage', {
      type: 'file',
      className: 'file-input preview-image hidden'
    }, previewImageButton);

    const imageWarning = this.state.isImageInvalid ?
      <div className="alert error">
        {_.get(I18n, 'external_resource_wizard.form.fields.preview_image.error')}
      </div> : null;

    return (
      <form className="external-resource-form">
        {titleField}
        {descriptionField}
        {urlField}
        {previewImageField}
        <br />
        {imageWarning}
      </form>
    );
  }
}

ExternalResourceForm.propTypes = {
  dispatchUpdateTitle: PropTypes.func.isRequired,
  dispatchUpdateDescription: PropTypes.func.isRequired,
  dispatchUpdateUrl: PropTypes.func.isRequired,
  dispatchUpdatePreviewImage: PropTypes.func.isRequired,
  title: PropTypes.object.isRequired,
  description: PropTypes.object.isRequired,
  url: PropTypes.object.isRequired,
  previewImage: PropTypes.object.isRequired
};

ExternalResourceForm.defaultProps = {
  dispatchUpdateTitle: _.noop,
  dispatchUpdateDescription: _.noop,
  dispatchUpdateUrl: _.noop,
  dispatchUpdatePreviewImage: _.noop,
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

function mapDispatchToProps(dispatch) {
  return {
    dispatchUpdateTitle: function(value) {
      dispatch(updateTitle(value));
    },
    dispatchUpdateDescription: function(value) {
      dispatch(updateDescription(value));
    },
    dispatchUpdateUrl: function(value) {
      dispatch(updateUrl(value));
    },
    dispatchUpdatePreviewImage: function(value) {
      dispatch(updatePreviewImage(value));
    }
  };
}

export default connect(null, mapDispatchToProps)(ExternalResourceForm);
