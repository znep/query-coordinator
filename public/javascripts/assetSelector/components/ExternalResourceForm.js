import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import { updateTitle, updateDescription, updateUrl, updatePreviewImage } from '../actions/externalResource';

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

  renderInputField(key, inputProps) {
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

    const titleWarning = this.props.title.invalid ?
      <div className="alert warning">Title cannot be blank{/* TODO: localization */}</div> :
      null;

    const urlWarning = this.props.url.invalid ?
      <div className="alert warning">URL is invalid{/* TODO: localization */}</div> :
      null;

    const imageWarning = this.state.isImageInvalid ?
      <div className="alert error">Error uploading image{/* TODO: localization */}</div> :
      null;

    return (
      <form className="external-resource-form">
        {titleField}
        {titleWarning}
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
