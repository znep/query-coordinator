import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import { updateField } from '../actions/externalResource';
import { VALID_URL_REGEX } from '../lib/constants';

export class ExternalResourceForm extends Component {
  constructor(props) {
    super(props);

    _.bindAll(this, ['onChange', 'renderInputField']);

    this.state = {
      isImageInvalid: false
    };
  }

  // Key is one of 'title', 'description', 'url', or 'previewImage'
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
        this.props.dispatchUpdateField(key, fileReader.result);
      }, false);

      if (file) {
        fileReader.readAsDataURL(file);
      }
    } else {
      this.props.dispatchUpdateField(key, event.target.value);
    }
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

    const imageWarning = this.state.isImageInvalid ?
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
  dispatchUpdateField: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
  previewImage: PropTypes.string.isRequired
};

ExternalResourceForm.defaultProps = {
  dispatchUpdateField: _.noop,
  title: '',
  description: '',
  url: '',
  previewImage: ''
};

function mapDispatchToProps(dispatch) {
  return {
    dispatchUpdateField: function(field, value) {
      dispatch(updateField(field, value));
    }
  };
}

export default connect(null, mapDispatchToProps)(ExternalResourceForm);
