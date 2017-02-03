import React, { Component, PropTypes } from 'react';
import _ from 'lodash';

export class ExternalResourceForm extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isImageInvalid: false
    };

    _.bindAll(this, ['onChange', 'renderInputField']);
  }

  onChange(key, event) {
    if (key === 'previewImage') {
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
        this.props.onFieldChange(key, fileReader.result);
      }, false);

      if (file) {
        fileReader.readAsDataURL(file);
      }
    } else {
      this.props.onFieldChange(key, event.target.value);
    }
  }

  renderInputField(key, inputProps, button = null) {
    const prefix = 'external-resource';
    const value = this.props[key];
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
      'placeholder': _.get(I18n, 'external_resource_wizard.form.fields.url.placeholder',
        'https://example.com')
    });

    // Use a styleguide button and hide the actual previewImage file input button.
    const previewImageButton = (
      <div>
        <button
          className="btn btn-primary"
          aria-labelledby="external-resource-preview-image-label"
          onClick={(e) => {
            e.preventDefault();
            this.hiddenPreviewImageInput.click();
          }}>
          {_.get(I18n, 'external_resource_wizard.form.fields.preview_image.button_text')}
        </button>
        <span> {this.props.previewImage ? '' :
          _.get(I18n, 'external_resource_wizard.form.fields.preview_image.no_file_chosen')}
        </span>
      </div>
    );
    const previewImageField = this.renderInputField('previewImage', {
      type: 'file',
      className: 'file-input preview-image hidden',
      ref: (input) => { this.hiddenPreviewImageInput = input; }
    }, previewImageButton);

    const imageWarning = this.state.isImageInvalid ?
      <div className="alert error image-warning">
        {_.get(I18n, 'external_resource_wizard.form.fields.preview_image.error')}
      </div> : null;

    return (
      <form className="external-resource-form">
        {titleField}
        {descriptionField}
        {urlField}
        {previewImageField}
        {imageWarning}
      </form>
    );
  }
}

ExternalResourceForm.propTypes = {
  description: PropTypes.string.isRequired,
  onFieldChange: PropTypes.func.isRequired,
  previewImage: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired
};

ExternalResourceForm.defaultProps = {
  description: '',
  onFieldChange: _.noop,
  previewImage: '',
  title: '',
  url: ''
};

export default ExternalResourceForm;
