import _ from 'lodash';
import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { handleKeyPress } from '../../lib/a11yHelpers';
import ViewWidget from '../ViewWidget';
import FormFooter from './FormFooter';
import {
  cancelFeaturedItemEdit,
  loadStory,
  saveFeaturedItem,
  setStoryUrlField
} from '../../actions/featuredContent';

export var StoryForm = React.createClass({
  propTypes: {
    canSave: PropTypes.bool,
    createdAt: PropTypes.string,
    description: PropTypes.string,
    hasSaveError: PropTypes.bool,
    hasValidationError: PropTypes.bool,
    imageUrl: PropTypes.string,
    isLoadingStory: PropTypes.bool,
    isSaved: PropTypes.bool,
    isSaving: PropTypes.bool,
    loadRequestedStory: PropTypes.func,
    onChangeUrl: PropTypes.func,
    onClickCancel: PropTypes.func,
    onClickSave: PropTypes.func,
    resetFocus: PropTypes.func,
    shouldLoadStory: PropTypes.bool,
    title: PropTypes.string,
    url: PropTypes.string,
    viewCount: PropTypes.number
  },

  getDefaultProps: function() {
    return {
      loadRequestedStory: _.noop,
      onChangeUrl: _.noop
    };
  },

  componentDidMount: function() {
    this.loadStoryIfNeeded();
    this.props.resetFocus();
  },

  componentDidUpdate: function() {
    this.loadStoryIfNeeded();

    if (this.props.hasSaveError) {
      var invalidField = ReactDOM.findDOMNode(this).querySelector('[aria-invalid="true"]');
      if (invalidField) {
        invalidField.focus();
      }
    }
  },

  onChangeUrl: function(event) {
    this.props.onChangeUrl(event.target.value);
  },

  loadStoryIfNeeded: function() {
    var { loadRequestedStory, shouldLoadStory } = this.props;

    if (shouldLoadStory) {
      loadRequestedStory();
    }
  },

  I18n: I18n.featured_content_modal.story_form,

  renderForm: function() {
    var { url, hasSaveError, hasValidationError, onClickSave } = this.props;

    var validationWarning = hasValidationError ?
      <div className="alert warning">{this.I18n.invalid_url_message}</div> :
      null;

    return (
      <form className="story-form">
        <label id="story-url-label" htmlFor="story-url" className="block-label label-url">
          {this.I18n.url}
        </label>

        <input
          id="story-url"
          className="text-input url"
          type="text"
          value={url}
          placeholder="https://example.com/stories/s/abcd-efgh"
          aria-labelledby="story-url-label"
          aria-invalid={hasValidationError || hasSaveError}
          onChange={this.onChangeUrl}
          onKeyDown={handleKeyPress(onClickSave, true)} />

        {validationWarning}
      </form>
    );
  },

  renderPreview: function() {
    var contents;
    var {
      description,
      title,
      createdAt,
      viewCount,
      imageUrl,
      canSave,
      isLoadingStory
    } = this.props;

    if (canSave) {
      var widgetProps = {
        name: title,
        description: description,
        displayType: 'story',
        imageUrl: imageUrl,
        viewCount: viewCount,
        updatedAt: createdAt
      };

      contents = <ViewWidget {...widgetProps} />;
    } else if (isLoadingStory) {
      contents = (
        <div className="spinner-wrapper">
          <span className="spinner-default spinner-large" />
        </div>
      );
    } else {
      contents = <div className="placeholder" />;
    }

    return (
      <div className="story-preview" aria-label={I18n.featured_content_modal.preview}>
        {contents}
      </div>
    );
  },

  renderContent: function() {
    var { hasSaveError, onClickCancel } = this.props;

    var backButton = (
      <button className="btn btn-default btn-simple btn-xs back-button" onClick={onClickCancel}>
        <span className="icon-arrow-prev" />
        {I18n.back}
      </button>
    );

    var saveError = hasSaveError ?
      <div className="alert error">{I18n.featured_content_modal.save_error_message}</div> :
      null;

    return (
      <div className="modal-content story">
        {backButton}

        <h2>{this.I18n.header}</h2>

        <p dangerouslySetInnerHTML={{ __html: this.I18n.message_html }} />

        <div className="story-contents">
          {this.renderForm()}
          {this.renderPreview()}
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

function mapStateToProps(state) {
  return {
    ...state.featuredContent,
    ...state.featuredContent.story
  };
}

function mapDispatchToProps(dispatch, ownProps) {
  return {
    loadRequestedStory: function() {
      dispatch(loadStory());
    },

    onClickCancel: function() {
      dispatch(cancelFeaturedItemEdit());
      ownProps.resetFocus();
    },

    onClickSave: function() {
      dispatch(saveFeaturedItem());
    },

    onChangeUrl: function(url) {
      dispatch(setStoryUrlField(url));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(StoryForm);
