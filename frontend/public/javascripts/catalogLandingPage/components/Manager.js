import 'whatwg-fetch';
import _ from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { defaultHeaders } from '../../common/http';
import format from 'stringformat';
import FeaturedContentManager from './FeaturedContentManager';
import StatCounts from './StatCounts';
import * as Actions from '../actions/header';
import airbrake from '../../common/airbrake';

export class Manager extends React.Component {
  constructor(props) {
    super(props);

    this.state = { errorMessage: null, isDismissing: false, isSaving: false, initialProps: props };

    _.bindAll(this, [
      'featuredContentForSave',
      'handleInputChange',
      'metadataForSave',
      'onDismiss',
      'handleSave'
    ]);
  }

  onDismiss() {
    this.setState({ isDismissing: true });
    window.location.href = this.props.catalogPath;
  }

  metadataForSave() {
    return _.pick(this.props.header, 'headline', 'description', 'showStats');
  }

  featuredContentForSave() {
    const featuredContentPayload = {};
    _.forOwn(this.props.featuredContent, (featuredContentItem, key) => {
      featuredContentPayload[key] = _.pick(featuredContentItem, 'description', 'position', 'removed', 'url');
      featuredContentPayload[key].title = featuredContentItem.name;
      featuredContentPayload[key].resource_id = featuredContentItem.id;

      if (featuredContentItem.contentType === 'external') {
        featuredContentPayload[key].contentType = 'external';

        const validBase64ImagePrefixRegex = new RegExp('^data:image/[jpe?g|png|gif];base64');
        // EN-15002: If a new image has been uploaded, it will have a base64 encoding as its `imageUrl`,
        // and we want to send it in the payload to core to turn it into a URL.
        if (validBase64ImagePrefixRegex.test(featuredContentItem.imageUrl)) {
          featuredContentPayload[key].previewImageBase64 = featuredContentItem.imageUrl;
        }
      } else {
        featuredContentPayload[key].contentType = 'internal';
        featuredContentPayload[key].featuredLensUid = featuredContentItem.uid;
      }
    });

    return featuredContentPayload;
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
      this.setState({ errorMessage: _.get(I18n, 'manager.unexpected_error') });
      console.error(error);
      airbrake.notify({
        error: `Error in Catalog Landing Page manager: ${error}`,
        context: { component: 'CatalogLandingPage' }
      });
    };

    const handleResponse = (response) => {
      this.setState({ isSaving: false, isDismissing: false });

      if (response.ok) {
        this.setState({ errorMessage: null });
        return response.json().then(redirectIfNeeded);
      } else {
        if (response.status === 401) {
          return this.setState({ errorMessage: _.get(I18n, 'you_must_login_first') });
        } else {
          return response.text().then((text) => {
            handleException(text);
          });
        }
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
    } else if (name === 'showStats') {
      this.props.toggleStats(value);
    }
  }

  render() {
    const { isSaving, isDismissing } = this.state;

    const headingHtml = (text) => {
      return <h6 className="h6 styleguide-subheader">{text}</h6>;
    };

    const formatWithCategory = (translationKey, translationKeyNoCategory = translationKey) => {
      return format(
        _.get(I18n, this.props.category ? translationKey : translationKeyNoCategory),
        { category: this.props.category }
      );
    };

    const renderShowStatsCheckbox = () => {
      const name = 'showStats';
      const label = _.get(I18n, 'manager.show_stats.label');

      return (
        <div className="checkbox show-stats">
          <input
            id={name}
            name={name}
            type="checkbox"
            aria-label="Show stats"
            checked={this.props.header.showStats}
            onChange={this.handleInputChange} />
          <label htmlFor={name}>
            <span className="fake-checkbox">
              <span className="socrata-icon-checkmark3"></span>
            </span>
            {label}
          </label>
        </div>);
    };

    const renderCategoryStats = () => {
      const { categoryStats } = this.props;

      return (
        <div className="catalog-landing-page-stats">
          <StatCounts categoryStats={categoryStats} />
        </div>
      );
    };

    const spinner = <span className="spinner-default spinner-btn-primary" />;

    const isDirty = !_.isEqual(this.state.initialProps, this.props);

    const errorMessageDiv = this.state.errorMessage ?
      (<div className="alert error">{this.state.errorMessage}</div>) : null;


    return (
      <div className="clp-manager">
        <h1 className="header">{_.get(I18n, 'manager.manage_this_category')}</h1>
        {errorMessageDiv}
        <div>
          <form>
            {headingHtml(_.get(I18n, 'manager.headline.label'))}
            <input
              className="text-input input-headline"
              name="headline"
              type="text"
              aria-label={_.get(I18n, 'manager.headline.placeholder')}
              maxLength="140"
              placeholder={_.get(I18n, 'manager.headline.placeholder')}
              onChange={this.handleInputChange}
              value={this.props.header.headline} />

            {headingHtml(_.get(I18n, 'manager.description.label'))}
            <input
              className="text-input input-description"
              name="description"
              type="text"
              aria-label={formatWithCategory('manager.description.placeholder')}
              maxLength="320"
              placeholder={formatWithCategory('manager.description.placeholder',
                  'manager.description.placeholder_no_category')}
              onChange={this.handleInputChange}
              value={this.props.header.description} />

            {headingHtml(formatWithCategory('manager.show_stats.label'))}
            <p className="small explanation">
              {_.get(I18n, 'manager.show_stats.explanation')}
            </p>
            {renderShowStatsCheckbox()}
            {renderCategoryStats()}

            {headingHtml(formatWithCategory('manager.featured_content.label',
                  'manager.featured_content.label_no_category'))}
            <p className="small explanation">
              {_.get(I18n, 'manager.featured_content.explanation')}
            </p>
            <FeaturedContentManager category={this.props.category} />
          </form>
        </div>

        <footer>
          <div>
            <button className="btn btn-default cancel-button" onClick={this.onDismiss}>
              {isDismissing ? spinner : _.get(I18n, 'manager.cancel')}
            </button>
            &nbsp;
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
  category: PropTypes.string,
  catalogPath: PropTypes.string.isRequired,
  catalogQuery: PropTypes.object,
  categoryStats: PropTypes.object,
  featuredContent: PropTypes.object,
  header: PropTypes.shape({
    headline: PropTypes.string,
    description: PropTypes.string,
    showStats: PropTypes.bool
  }),
  toggleStats: PropTypes.func.isRequired,
  updateDescription: PropTypes.func.isRequired,
  updateHeadline: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
  catalogPath: state.catalog.path,
  catalogQuery: _.isString(state.catalog.query) ?
    { custom_path: state.catalog.query } :
    state.catalog.query,
  category: state.category,
  categoryStats: state.categoryStats,
  featuredContent: state.featuredContent,
  header: state.header
});

const mapDispatchToProps = dispatch => ({
  toggleStats: (checked) => dispatch(Actions.toggleStats(checked)),
  updateDescription: (text) => dispatch(Actions.updateDescription(text)),
  updateHeadline: (text) => dispatch(Actions.updateHeadline(text))
});

export default connect(mapStateToProps, mapDispatchToProps)(Manager);
