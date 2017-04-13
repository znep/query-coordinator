import React, { PropTypes } from 'react';
import _ from 'lodash';
import { handleEnter } from '../../helpers/keyPressHelpers';
import { fetchTranslation } from '../../../common/locale';

export class ExternalResourceForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = { isImageValid: true, initialProps: props };

    _.bindAll(this, ['onChange', 'onKeyDown', 'renderInputField']);
  }

  onChange(inputName, event) {
    if (inputName === 'previewImage') {
      // Upload image
      const file = event.target.files[0];
      const isFileValidImageType = file && /\.(jpe?g|png|gif)$/i.test(file.name);

      this.setState({
        isImageValid: isFileValidImageType
      });

      if (!isFileValidImageType) {
        return;
      }

      const fileReader = new FileReader();

      fileReader.addEventListener('load', () => {
        this.props.onFieldChange(inputName, fileReader.result);
      }, false);

      fileReader.addEventListener('error', () => {
        this.setState({ isImageValid: false });
      });

      if (file) {
        fileReader.readAsDataURL(file);
      }
    } else {
      this.props.onFieldChange(inputName, event.target.value);
    }
  }

  onKeyDown(event) {
    event.preventDefault();
    event.stopPropagation();
    this.props.onEnter();
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
      onChange: (event) => { this.onChange(inputName, event); },
      onKeyDown: handleEnter(this.onKeyDown)
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

    const imageWarning = this.state.isImageValid ? null :
      <div className="alert error image-warning">
        {_.get(I18n, 'common.external_resource_editor.form.fields.preview_image.error')}
      </div>;

    const imageHint = (<div className="alert info image-hint">
      {fetchTranslation('common.external_resource_editor.form.fields.preview_image.hint')}
    </div>);

    return (
      <form className="external-resource-form">
        {titleField}
        {descriptionField}
        {urlField}
        {previewImageField}
        {imageHint}
        {imageWarning}
      </form>
    );
  }
}

ExternalResourceForm.propTypes = {
  description: PropTypes.string,
  onEnter: PropTypes.func,
  onFieldChange: PropTypes.func.isRequired,
  previewImage: PropTypes.string,
  title: PropTypes.string,
  url: PropTypes.string
};

ExternalResourceForm.defaultProps = {
  description: '',
  onEnter: _.noop,
  previewImage: '',
  title: '',
  url: ''
};

export default ExternalResourceForm;
