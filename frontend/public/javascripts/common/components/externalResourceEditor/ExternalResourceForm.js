import React, { PropTypes } from 'react';
import _ from 'lodash';

export class ExternalResourceForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isImageInvalid: false
    };

    _.bindAll(this, ['onChange', 'renderInputField']);
  }

  onChange(inputName, event) {
    if (inputName === 'previewImage') {
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
        this.props.onFieldChange(inputName, fileReader.result);
      }, false);

      fileReader.addEventListener('error', () => {
        this.setState({
          isImageInvalid: true
        });
      });

      if (file) {
        fileReader.readAsDataURL(file);
      }
    } else {
      this.props.onFieldChange(inputName, event.target.value);
    }
  }

  renderInputField(inputName, inputProps, button = null) {
    const prefix = 'external-resource';
    const value = this.props[inputName];
    const kebabKey = _.kebabCase(inputName);

    inputProps = _.defaults(inputProps, {
      id: `${prefix}-${kebabKey}`,
      className: `text-input ${kebabKey}`,
      type: 'text',
      'aria-labelledby': `${prefix}-${kebabKey}-label`,
      onChange: (event) => { this.onChange(inputName, event); }
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
          {_.get(I18n, `common.external_resource_editor.form.fields.${_.snakeCase(inputName)}.label`)}
        </label>

        {button}
        <input {...inputProps} />
      </div>
    );
  }

  render() {
    const titleField = this.renderInputField('title', {
      maxLength: 80,
      'placeholder': _.get(I18n, 'common.external_resource_editor.form.fields.title.placeholder')
    });
    const descriptionField = this.renderInputField('description', {
      maxLength: 160,
      'placeholder': _.get(I18n, 'common.external_resource_editor.form.fields.description.placeholder')
    });
    const urlField = this.renderInputField('url', {
      'placeholder': _.get(I18n, 'common.external_resource_editor.form.fields.url.placeholder')
    });

    const previewImageButtonProps = {
      className: 'btn btn-primary',
      'aria-labelledby': 'external-resource-preview-image-label',
      onClick: (e) => {
        e.preventDefault();
        this.hiddenPreviewImageInput.click();
      }
    };

    const noFileChosenText = this.props.previewImage ? null : (
      <span> {_.get(I18n, 'common.external_resource_editor.form.fields.preview_image.no_file_chosen')}</span>
    );

    // Use a styleguide button and hide the actual previewImage file input button.
    const previewImageButton = (
      <div>
        <button {...previewImageButtonProps}>
          {_.get(I18n, 'common.external_resource_editor.form.fields.preview_image.button_text')}
        </button>
        {noFileChosenText}
      </div>
    );
    const previewImageField = this.renderInputField('previewImage', {
      type: 'file',
      className: 'file-input preview-image hidden',
      ref: (input) => { this.hiddenPreviewImageInput = input; }
    }, previewImageButton);

    const imageWarning = this.state.isImageInvalid ?
      <div className="alert error image-warning">
        {_.get(I18n, 'common.external_resource_editor.form.fields.preview_image.error')}
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
