import React, { Component, PropTypes } from 'react';
import _ from 'lodash';
import { VALID_URL_REGEX } from '../lib/constants';

export class ExternalResourceForm extends Component {
  constructor(props) {
    super(props);
    _.bindAll(this, ['renderInputField']);
  }

  renderInputField(key, inputProps) {
    const prefix = 'external-resource';
    const value = this.props[key];
    const kebabKey = _.kebabCase(key);

    inputProps = _.defaults(inputProps, {
      id: `${prefix}-${kebabKey}`,
      className: `text-input ${kebabKey}`,
      type: 'text',
      'aria-labelledby': `${prefix}-${kebabKey}-label`,
      onChange: (event) => { this.props.onChange(key, event); }
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
          {_.snakeCase(key)}{/* TODO: localization */}
        </label>

        <input {...inputProps} />
      </div>
    );
  }

  render() {
    const titleField = this.renderInputField('title', { maxLength: 80 });
    const descriptionField = this.renderInputField('description', { maxLength: 160 });
    const urlField = this.renderInputField('url', {
      'placeholder': 'https://example.com'
    });
    const previewImageField = this.renderInputField('previewImage', {
      type: 'file',
      className: 'file-input preview-image'
    });

    const isUrlInvalid = !_.isEmpty(this.props.url) && !VALID_URL_REGEX.test(this.props.url);

    const urlWarning = isUrlInvalid ?
      <div className="alert warning">URL is invalid{/* TODO: localization */}</div> :
      null;

    const imageWarning = this.props.isImageInvalid ?
      <div className="alert error">Error uploading image{/* TODO: localization */}</div> :
      null;

    return (
      <form className="external-resource-form">
        {titleField}
        {descriptionField}
        {urlField}
        {urlWarning}
        {previewImageField}
        {imageWarning}
      </form>
    );
  }
}

ExternalResourceForm.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
  previewImage: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  isImageInvalid: PropTypes.bool.isRequired
};

ExternalResourceForm.defaultProps = {
  title: '',
  description: '',
  url: '',
  previewImage: '',
  onChange: _.noop,
  isImageInvalid: false
};

export default ExternalResourceForm;
