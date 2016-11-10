import _ from 'lodash';
import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { VALID_URL_REGEX } from '../../lib/constants';
import { ExternalViewCard } from 'socrata-components';
import FeaturedContentModalHeader from './FeaturedContentModalHeader';
import FormFooter from './FormFooter';
import {
  cancelFeaturedItemEdit,
  saveFeaturedItem,
  setExternalResourceField
} from '../../actions/featuredContent';

export var ExternalResourceForm = React.createClass({
  propTypes: {
    canSave: PropTypes.bool,
    description: PropTypes.string,
    hasSaveError: PropTypes.bool,
    previewImage: PropTypes.string,
    isSaved: PropTypes.bool,
    isSaving: PropTypes.bool,
    onChangeDescription: PropTypes.func,
    onChangePreviewImage: PropTypes.func,
    onChangeTitle: PropTypes.func,
    onChangeUrl: PropTypes.func,
    onClickCancel: PropTypes.func,
    onClickClose: PropTypes.func,
    onClickSave: PropTypes.func,
    title: PropTypes.string,
    url: PropTypes.string
  },

  // These are defaulted to reduce ceremony in onChange* functions.
  getDefaultProps() {
    return {
      onChangeDescription: _.noop,
      onChangePreviewImage: _.noop,
      onChangeTitle: _.noop,
      onChangeUrl: _.noop
    };
  },

  getInitialState() {
    return {
      isImageInvalid: false
    };
  },

  componentDidMount() {
    ReactDOM.findDOMNode(this).querySelector('h2').focus();
  },

  onChangeDescription(event) {
    this.props.onChangeDescription(event.target.value);
  },

  onChangePreviewImage(event) {
    var { onChangePreviewImage } = this.props;

    var file = event.target.files[0];
    var isFileImage = file && /\.(jpe?g|png|gif)$/i.test(file.name);

    this.setState({
      isImageInvalid: !isFileImage
    });

    if (!isFileImage) {
      return;
    }

    var fileReader = new FileReader();

    fileReader.addEventListener('load', () => {
      var dataUrl = fileReader.result;
      onChangePreviewImage(dataUrl);
    }, false);

    if (file) {
      fileReader.readAsDataURL(file);
    }
  },

  onChangeTitle(event) {
    this.props.onChangeTitle(event.target.value);
  },

  onChangeUrl(event) {
    this.props.onChangeUrl(event.target.value);
  },

  I18n: I18n.featured_content_modal.external_resource_form,

  renderInputField(key, inputProps) {
    var prefix = 'external-resource';
    var value = this.props[key];
    var onChange = this[`onChange${_.upperFirst(key)}`];
    var kebabKey = _.kebabCase(key);

    inputProps = _.defaults(inputProps, {
      id: `${prefix}-${kebabKey}`,
      className: `text-input ${kebabKey}`,
      type: 'text',
      'aria-labelledby': `${prefix}-${kebabKey}-label`,
      onChange: onChange
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
          {this.I18n[_.snakeCase(key)]}
        </label>

        <input {...inputProps} />
      </div>
    );
  },

  renderPreview() {
    var { description, previewImage, title } = this.props;

    var cardProps = {
      description: _.isEmpty(description) ? this.I18n.description : description,
      imageUrl: _.isEmpty(previewImage) ? null : previewImage,
      name: _.isEmpty(title) ? this.I18n.title : title
    };

    return <ExternalViewCard {...cardProps} />;
  },

  renderContent() {
    var { url, hasSaveError, onClickCancel } = this.props;
    var { isImageInvalid } = this.state;

    var isUrlInvalid = !_.isEmpty(url) && !VALID_URL_REGEX.test(url);

    var backButton = (
      <button className="btn btn-default btn-simple btn-xs back-button" onClick={onClickCancel}>
        <span className="icon-arrow-prev" />
        {I18n.back}
      </button>
    );

    var titleField = this.renderInputField('title', { maxLength: 80 });
    var descriptionField = this.renderInputField('description', { maxLength: 160 });
    var urlField = this.renderInputField('url', {
      'placeholder': 'https://example.com',
      'aria-invalid': isUrlInvalid
    });
    var previewImageField = this.renderInputField('previewImage', {
      type: 'file',
      className: 'file-input preview-image'
    });

    var urlWarning = isUrlInvalid ?
      <div className="alert warning">{this.I18n.invalid_url_message}</div> :
      null;

    var imageWarning = isImageInvalid ?
      <div className="alert error">{this.I18n.invalid_image_message}</div> :
      null;

    var saveError = hasSaveError ?
      <div className="alert error">{I18n.featured_content_modal.save_error_message}</div> :
      null;

    return (
      <div className="modal-content external-resource">
        <div className="container">
          {backButton}

          <h2 tabIndex="0">{this.I18n.header}</h2>

          <p>{this.I18n.message}</p>

          <div className="external-resource-contents">
            <form className="external-resource-form">
              {titleField}
              {descriptionField}
              {urlField}
              {urlWarning}
              {previewImageField}
              {imageWarning}
            </form>

            <div className="external-resource-preview">
              {this.renderPreview()}
            </div>
          </div>

          {saveError}
        </div>
      </div>
    );
  },

  renderFooter() {
    var { canSave, isSaved, isSaving, onClickCancel, onClickSave } = this.props;
    var { isImageInvalid } = this.state;

    var footerProps = {
      cancelText: I18n.cancel,
      canSave: canSave && !isImageInvalid,
      displaySaveButton: true,
      isSaved: isSaved,
      isSaving: isSaving,
      onClickCancel: onClickCancel,
      onClickSave: onClickSave,
      saveText: I18n.save,
      savedText: `${I18n.saved}!`
    };

    return <FormFooter {...footerProps} />;
  },

  render() {
    var { onClickClose } = this.props;

    return (
      <div className="modal-container">
        <FeaturedContentModalHeader onClickClose={onClickClose} />
        {this.renderContent()}
        {this.renderFooter()}
      </div>
    );
  }
});

// Merge state.featuredContent.externalResource to top-level for convenience.
function mapStateToProps(state) {
  return {
    ...state.featuredContent,
    ...state.featuredContent.externalResource
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onChangeDescription(description) {
      dispatch(setExternalResourceField('description', description));
    },

    onChangeTitle(title) {
      dispatch(setExternalResourceField('title', title));
    },

    onChangeUrl(url) {
      dispatch(setExternalResourceField('url', url));
    },

    onChangePreviewImage(previewImage) {
      dispatch(setExternalResourceField('previewImage', previewImage));
    },

    onClickCancel() {
      dispatch(cancelFeaturedItemEdit());
    },

    onClickClose() {
      dispatch(cancelFeaturedItemEdit());
    },

    onClickSave() {
      dispatch(saveFeaturedItem());
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ExternalResourceForm);