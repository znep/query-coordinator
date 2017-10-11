import 'whatwg-fetch';
import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { defaultHeaders } from 'common/http';
import { handleEnter } from 'common/dom_helpers/keyPressHelpers';
import format from 'stringformat';
import FeaturedContentManager from './FeaturedContentManager';
import HelpFlyout from './HelpFlyout';
import ManagerSectionHeader from './ManagerSectionHeader';
import MarkdownHelpFlannel from './MarkdownHelpFlannel';
import * as Actions from '../actions/header';
import airbrake from 'common/airbrake';
import { FeatureFlags } from 'common/feature_flags';
import { fetchTranslation } from 'common/locale';

/* eslint no-empty: ["error", { "allowEmptyCatch": true }] */

export class Manager extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      errorMessage: null,
      isDismissing: false,
      isSaving: false,
      showingMarkdownHelp: false,
      initialProps: props
    };

    _.bindAll(this, [
      'featuredContentForSave',
      'handleInputChange',
      'metadataForSave',
      'onDismiss',
      'onToggleMarkdownHelp',
      'handleSave',
      'saveOnEnter'
    ]);
  }

  onDismiss() {
    this.setState({ isDismissing: true });
    window.location.href = this.props.catalogPath;
  }

  onToggleMarkdownHelp() {
    this.setState({ showingMarkdownHelp: !this.state.showingMarkdownHelp });
  }

  metadataForSave() {
    return _.pick(this.props.header, 'headline', 'description');
  }

  featuredContentForSave() {
    const featuredContentPayload = {};
    _.forOwn(this.props.featuredContent, (featuredContentItem, key) => {
      featuredContentPayload[key] = _.pick(featuredContentItem, 'description', 'position', 'removed', 'url');
      featuredContentPayload[key].title = featuredContentItem.name;
      featuredContentPayload[key].resource_id = featuredContentItem.id;

      if (featuredContentItem.contentType === 'external') {
        featuredContentPayload[key].contentType = 'external';

        const validBase64ImagePrefixRegex = new RegExp('^data:image/(jpe?g|png|gif);base64', 'i');
        // EN-15002: If a new image has been uploaded, it will have a base64 encoding as its `imageUrl`,
        // and we want to send it in the payload to core to turn it into a URL.
        if (validBase64ImagePrefixRegex.test(featuredContentItem.imageUrl)) {
          featuredContentPayload[key].previewImageBase64 = featuredContentItem.imageUrl;
        }
      } else {
        featuredContentPayload[key].contentType = 'internal';
        featuredContentPayload[key].featuredLensUid = featuredContentItem.uid;
        // EN-15773: For internal featured content items, the imageUrl is going to be something like:
        // https://domain.gov/views/rjq6-7bhn/files/83703c09-8c91-45f1-8a38-63f9c5112277
        // The featured content api only accepts the id portion at the end, so parse it out for the payload.
        if (featuredContentItem.imageUrl) {
          const previewImageId = featuredContentItem.imageUrl.match(/(([a-z0-9]+-){4})[a-z0-9]+$/);
          if (previewImageId && previewImageId[0]) {
            featuredContentPayload[key].previewImageId = previewImageId[0];
          }
        }
      }
    });

    return featuredContentPayload;
  }

  saveOnEnter(event) {
    event.preventDefault();
    event.stopPropagation();
    this.handleSave();
  }

  handleSave() {
    this.setState({ isSaving: true });

    const payloadBody = {
      catalog_query: this.props.catalogQuery,
      metadata: this.metadataForSave(),
      featured_content: this.featuredContentForSave()
    };

    const fetchOptions = {
      method: 'PUT',
      redirect: 'manual',
      credentials: 'same-origin',
      headers: defaultHeaders,
      body: JSON.stringify(payloadBody)
    };

    const redirectIfNeeded = function(response) {
      if (window.location.href !== response.href) {
        window.location.href = response.href;
      }
      return response;
    };

    const handleException = (error = '') => {
      this.setState({ errorMessage: fetchTranslation('manager.error.unexpected_500') });
      console.error(error);
      try {
        airbrake.notify({
          error: `Error in Catalog Landing Page manager: ${error}`,
          context: { component: 'CatalogLandingPage' }
        });
      } catch (err) {}
    };

    const handleResponse = (response) => {
      this.setState({ isSaving: false, isDismissing: false });

      if (response.ok) {
        this.setState({ errorMessage: null });
        return response.json().then(redirectIfNeeded);
      } else {
        // A redirect will be seen if the session has expired and we get redirected to the login page.
        // Unfortunately, fetch does not set the status to 302 in this case, but instead sets it to 0
        // so we have to look in the response.type instead.
        if (response.status === 401 || response.status === 302 || response.type === 'opaqueredirect') {
          return this.setState({ errorMessage: fetchTranslation('manager.error.you_must_login_first') });
        }
        // It possible to see a 403 if the user formerly had permissions, but they have subsequently been
        // revoked. Rather than showing a "something went wrong", let's show them a real error message.
        if (response.status === 403) {
          return this.setState({ errorMessage: fetchTranslation('manager.error.you_are_not_authorized') });
        }

        return response.text().then((text) => {
          handleException(text); // 500
        });
      }
    };

    fetch('/catalog_landing_page/manage', fetchOptions).
      then(handleResponse).
      catch(handleException);
  }

  handleInputChange(event) {
    const target = event.target;
    const value = (target.type === 'checkbox') ? target.checked : target.value;
    const name = target.name;

    if (name === 'headline') {
      this.props.updateHeadline(value);
    } else if (name === 'description') {
      this.props.updateDescription(value);
    }
  }

  render() {
    const { isSaving, isDismissing } = this.state;

    const formatWithFilter = (translationKey, translationKeyNoFilter = translationKey) => {
      // Special `/browse` case: omit { custom_path: '/browse' }
      const validFilters = _.omit(this.props.catalogQuery, ['custom_path']);

      // There should only ever be one filter
      const filterType = _.keys(validFilters)[0];
      const filterValue = validFilters[filterType];

      const filterName = (filterType === 'limitTo') ?
        _.get(I18n, `view_types.${filterValue}`, null) :
        _.startCase(filterValue);

      return format(
        _.get(I18n, filterName ? translationKey : translationKeyNoFilter),
        { filter: filterName }
      );
    };

    const spinner = <span className="spinner-default spinner-btn-primary" />;

    const isDirty = !_.isEqual(this.state.initialProps, this.props);

    const errorMessageDiv = this.state.errorMessage ?
      (<div className="alert error">{this.state.errorMessage}</div>) : null;

    const metadataInputProps = (section) => ({
      className: `text-input input-${section}`,
      name: section,
      onChange: this.handleInputChange,
      type: 'text',
      value: this.props.header[section]
    });

    const descriptionMarkdownEnabled = FeatureFlags.
      value('enable_markdown_for_catalog_landing_page_description');

    // EN-15607: When a user hits the Enter key on a description field, do nothing if markdown is enabled
    // because they can enter a new line. If markdown is disabled, then save the form on Enter.
    const onDescriptionEnter = descriptionMarkdownEnabled ? _.noop : this.saveOnEnter;

    const descriptionPlaceholder = formatWithFilter('manager.description.placeholder',
      'manager.description.placeholder_no_filter');

    const descriptionProps = {
      ...metadataInputProps('description'),
      'aria-label': descriptionPlaceholder,
      maxLength: 1000,
      onKeyDown: handleEnter(onDescriptionEnter),
      placeholder: descriptionPlaceholder
    };

    let markdownSupported = '';
    let markdownHelp = '';
    if (descriptionMarkdownEnabled) {
      const markdownAccepted = { __html: _.get(I18n, 'manager.description.markdown_accepted') };

      markdownSupported = (
        <div onClick={this.onToggleMarkdownHelp} className="acceptsMarkdown">
          <span dangerouslySetInnerHTML={markdownAccepted} />
          <i className="socrata-icon-info"></i>
        </div>);

      if (this.state.showingMarkdownHelp) {
        const element = document.getElementsByClassName('acceptsMarkdown')[0];
        markdownHelp = (<MarkdownHelpFlannel
          target={element}
          onDismiss={this.onToggleMarkdownHelp} />);
      }
    }

    // EN-15512: Use a textarea tag if description markdown is enabled
    const description = descriptionMarkdownEnabled ?
        (<div><textarea {...descriptionProps} />{markdownSupported}{markdownHelp}</div>) :
        (<input {...descriptionProps} />);

    const assetSelectorTitle = formatWithFilter('manager.asset_selector.header_title_with_filter',
      'common.asset_selector.header_title');

    return (
      <div className="clp-manager">
        <h1 className="header">
          <span>{formatWithFilter('manager.feature_content', 'manager.feature_content_no_filter')}</span>
          <HelpFlyout right text={_.get(I18n, 'activation.whats_this')} />
        </h1>
        {errorMessageDiv}
        <div>
          <form>
            <ManagerSectionHeader className="headline-header">
              {_.get(I18n, 'manager.headline.label')}
            </ManagerSectionHeader>
            <input
              {...metadataInputProps('headline')}
              aria-label={_.get(I18n, 'manager.headline.placeholder')}
              maxLength="140"
              placeholder={_.get(I18n, 'manager.headline.placeholder')}
              onKeyDown={handleEnter(this.saveOnEnter)} />

            <ManagerSectionHeader className="description-header">
              {_.get(I18n, 'manager.description.label')}
            </ManagerSectionHeader>
            {description}

            <ManagerSectionHeader className="featured-content-header">
              {_.get(I18n, 'manager.featured_content.label_no_filter')}
            </ManagerSectionHeader>
            <p className="small explanation">
              {_.get(I18n, 'manager.featured_content.explanation')}
            </p>
            <FeaturedContentManager assetSelectorTitle={assetSelectorTitle} />
          </form>
        </div>

        <footer>
          <div>
            <button className="btn btn-default cancel-button" onClick={this.onDismiss}>
              {isDismissing ? spinner : _.get(I18n, 'manager.cancel')}
            </button>
            <button className="btn btn-primary save-button" onClick={this.handleSave} disabled={!isDirty}>
              {isSaving ? spinner : _.get(I18n, 'manager.save')}
            </button>
          </div>
        </footer>
      </div>
    );
  }
}

Manager.propTypes = {
  catalogPath: PropTypes.string.isRequired,
  catalogQuery: PropTypes.object,
  featuredContent: PropTypes.object,
  header: PropTypes.shape({
    headline: PropTypes.string,
    description: PropTypes.string
  }),
  updateDescription: PropTypes.func.isRequired,
  updateHeadline: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
  catalogPath: state.catalog.path,
  catalogQuery: state.catalog.query,
  featuredContent: state.featuredContent,
  header: state.header
});

const mapDispatchToProps = dispatch => ({
  updateDescription: (text) => dispatch(Actions.updateDescription(text)),
  updateHeadline: (text) => dispatch(Actions.updateHeadline(text))
});

export default connect(mapStateToProps, mapDispatchToProps)(Manager);
