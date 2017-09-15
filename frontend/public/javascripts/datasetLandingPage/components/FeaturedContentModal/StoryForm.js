import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import FeaturedContentModalHeader from './FeaturedContentModalHeader';
import FormFooter from './FormFooter';
import { ViewCard } from 'common/components';
import { getDateLabel, getViewCountLabel } from '../../../common/helpers/viewCardHelpers';
import {
  cancelFeaturedItemEdit,
  loadStory,
  saveFeaturedItem,
  setStoryUrlField
} from '../../actions/featuredContent';

export class StoryForm extends Component {
  constructor(props) {
    super(props);

    this.I18n = I18n.featured_content_modal.story_form;

    _.bindAll(this, 'onChangeUrl');
  }

  componentDidMount() {
    ReactDOM.findDOMNode(this).querySelector('h2').focus();

    this.loadRequestedStory = _.debounce(this.loadRequestedStory, 500, { leading: true });
    this.loadStoryIfNeeded();
  }

  componentDidUpdate() {
    this.loadStoryIfNeeded();

    if (this.props.hasSaveError) {
      const invalidField = ReactDOM.findDOMNode(this).querySelector('[aria-invalid="true"]');
      if (invalidField) {
        invalidField.focus();
      }
    }
  }

  onChangeUrl(event) {
    this.props.onChangeUrl(event.target.value);
  }

  onSubmit(event) {
    event.preventDefault();
  }

  loadRequestedStory() {
    this.props.loadRequestedStory();
  }

  loadStoryIfNeeded() {
    if (this.props.shouldLoadStory) {
      this.loadRequestedStory();
    }
  }

  renderForm() {
    const { url, hasSaveError, hasValidationError } = this.props;

    const validationWarning = hasValidationError ?
      <div className="alert warning">{this.I18n.invalid_url_message}</div> :
      null;

    return (
      <form className="story-form" onSubmit={this.onSubmit}>
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
          onChange={this.onChangeUrl} />

        {validationWarning}
      </form>
    );
  }

  renderPreview() {
    let contents;
    const {
      description,
      title,
      createdAt,
      viewCount,
      canSave,
      imageUrl,
      isLoadingStory,
      isPrivate
    } = this.props;

    if (canSave) {
      const cardProps = {
        name: title,
        description: description,
        icon: 'icon-story',
        imageUrl: imageUrl,
        isPrivate: isPrivate,
        metadataLeft: getDateLabel(createdAt),
        metadataRight: getViewCountLabel(viewCount)
      };

      contents = <ViewCard {...cardProps} />;
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
  }

  renderContent() {
    const { hasSaveError, onClickCancel } = this.props;

    const backButton = (
      <button className="btn btn-default btn-simple btn-xs back-button" onClick={onClickCancel}>
        <span className="icon-arrow-prev" />
        {I18n.back}
      </button>
    );

    const saveError = hasSaveError ?
      <div className="alert error">{I18n.featured_content_modal.save_error_message}</div> :
      null;

    return (
      <div className="modal-content story">
        <div className="container">
          {backButton}

          <h2 tabIndex="0">{this.I18n.header}</h2>

          <p dangerouslySetInnerHTML={{ __html: this.I18n.message_html }} />

          <div className="story-contents">
            {this.renderForm()}
            {this.renderPreview()}
          </div>

          {saveError}
        </div>
      </div>
    );
  }

  renderFooter() {
    const { canSave, isSaved, isSaving, onClickCancel, onClickSave } = this.props;

    const footerProps = {
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
  }

  render() {
    const { onClickClose } = this.props;

    return (
      <div className="modal-container">
        <FeaturedContentModalHeader onClickClose={onClickClose} />
        {this.renderContent()}
        {this.renderFooter()}
      </div>
    );
  }
}

StoryForm.propTypes = {
  canSave: PropTypes.bool,
  createdAt: PropTypes.string,
  description: PropTypes.string,
  hasSaveError: PropTypes.bool,
  hasValidationError: PropTypes.bool,
  imageUrl: PropTypes.string,
  isLoadingStory: PropTypes.bool,
  isPrivate: PropTypes.bool,
  isSaved: PropTypes.bool,
  isSaving: PropTypes.bool,
  loadRequestedStory: PropTypes.func,
  onChangeUrl: PropTypes.func,
  onClickCancel: PropTypes.func,
  onClickClose: PropTypes.func,
  onClickSave: PropTypes.func,
  shouldLoadStory: PropTypes.bool,
  title: PropTypes.string,
  url: PropTypes.string,
  viewCount: PropTypes.number
};

StoryForm.defaultProps = {
  loadRequestedStory: _.noop,
  onChangeUrl: _.noop
};

function mapStateToProps(state) {
  return {
    ...state.featuredContent,
    ...state.featuredContent.story
  };
}

function mapDispatchToProps(dispatch) {
  return {
    loadRequestedStory() {
      dispatch(loadStory());
    },

    onClickCancel() {
      dispatch(cancelFeaturedItemEdit());
    },

    onClickClose() {
      dispatch(cancelFeaturedItemEdit());
    },

    onClickSave() {
      dispatch(saveFeaturedItem());
    },

    onChangeUrl(url) {
      dispatch(setStoryUrlField(url));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(StoryForm);
