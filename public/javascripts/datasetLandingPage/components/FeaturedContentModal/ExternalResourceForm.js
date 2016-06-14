import _ from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { VALID_URL_REGEX } from '../../lib/constants';
import ViewWidget from '../ViewWidget';
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
    hasError: PropTypes.bool,
    isSaved: PropTypes.bool,
    isSaving: PropTypes.bool,
    onChangeDescription: PropTypes.func,
    onChangeTitle: PropTypes.func,
    onChangeUrl: PropTypes.func,
    onClickCancel: PropTypes.func,
    onClickSave: PropTypes.func,
    title: PropTypes.string,
    url: PropTypes.string
  },

  // These are defaulted to reduce ceremony in onChange* functions.
  getDefaultProps: function() {
    return {
      onChangeDescription: _.noop,
      onChangeTitle: _.noop,
      onChangeUrl: _.noop
    };
  },

  onChangeDescription: function(event) {
    this.props.onChangeDescription(event.target.value);
  },

  onChangeTitle: function(event) {
    this.props.onChangeTitle(event.target.value);
  },

  onChangeUrl: function(event) {
    this.props.onChangeUrl(event.target.value);
  },

  I18n: I18n.featured_content_modal.external_resource_form,

  renderInputField: function(key, inputProps) {
    var prefix = 'external-resource';
    var value = this.props[key];
    var onChange = this[`onChange${_.capitalize(key)}`];

    return (
      <div>
        <label
          id={`${prefix}-${key}-label`}
          htmlFor={`${prefix}-${key}`}
          className={`block-label label-${key}`}>
          {this.I18n[key]}
        </label>

        <input
          id={`${prefix}-${key}`}
          className={`text-input ${key}`}
          type="text"
          value={value}
          aria-labelledby={`${prefix}-${key}-label`}
          onChange={onChange}
          {...inputProps} />
      </div>
    );
  },

  renderPreview: function() {
    var { description, title } = this.props;

    var widgetProps = {
      name: _.isEmpty(title) ? this.I18n.title : title,
      description: _.isEmpty(description) ? this.I18n.description : description,
      isExternal: true
    };

    return <ViewWidget {...widgetProps} />;
  },

  renderContent: function() {
    var { url, hasError, onClickCancel } = this.props;

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

    var urlWarning = isUrlInvalid ?
      <div className="alert warning">{this.I18n.invalid_url_message}</div> :
      null;

    var saveError = hasError ?
      <div className="alert error">{this.I18n.save_error_message}</div> :
      null;

    return (
      <div className="modal-content external-resource">
        {backButton}

        <h2>{this.I18n.header}</h2>

        <p>{this.I18n.message}</p>

        <div className="external-resource-contents">
          <form className="external-resource-form">
            {titleField}
            {descriptionField}
            {urlField}
            {urlWarning}
          </form>

          <div className="external-resource-preview">
            {this.renderPreview()}
          </div>
        </div>

        {saveError}
      </div>
    );
  },

  renderFooter: function() {
    var { canSave, isSaved, isSaving, onClickCancel, onClickSave } = this.props;

    var footerProps = {
      cancelText: I18n.cancel,
      canSave: canSave,
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

  render: function() {
    return (
      <div>
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
    onChangeDescription: function(description) {
      dispatch(setExternalResourceField('description', description));
    },

    onChangeTitle: function(title) {
      dispatch(setExternalResourceField('title', title));
    },

    onChangeUrl: function(url) {
      dispatch(setExternalResourceField('url', url));
    },

    onClickCancel: function() {
      dispatch(cancelFeaturedItemEdit());
    },

    onClickSave: function() {
      dispatch(saveFeaturedItem());
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ExternalResourceForm);
