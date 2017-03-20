import 'whatwg-fetch';
import _ from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { defaultHeaders } from '../../common/http';
import format from 'stringformat';
import CategoryStat from './CategoryStat';
import FeaturedContentManager from './FeaturedContentManager';
import * as Actions from '../actions/header';
import airbrake from '../../common/airbrake';

class Manager extends React.Component {
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
    window.location.href = `/browse?category=${this.props.category}`;
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
        featuredContentPayload[key].previewImageBase64 = featuredContentItem.imageUrl;
      } else {
        featuredContentPayload[key].contentType = 'internal';
        featuredContentPayload[key].featuredLensUid = featuredContentItem.uid;
      }
    });

    return featuredContentPayload;
  }

  handleSave() {
    this.setState({ isSaving: true });

    const data = {
      catalog_query: {
        category: this.props.category
      },
      metadata: this.metadataForSave(),
      featured_content: this.featuredContentForSave()
    };

    const fetchOptions = {
      method: 'PUT',
      credentials: 'same-origin',
      headers: defaultHeaders,
      body: JSON.stringify(data)
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

    const formatWithCategory = (translationKey) => {
      return format(
        _.get(I18n, translationKey),
        { category: this.props.category }
      );
    };

    const showStatsCheckbox = () => {
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

    const categoryStats = () => {
      // Yes, this code is copy and pasted from the CategoryStats component,
      // except without the header.
      const sortedStats = () => (_(this.props.categoryStats).toPairs().sortBy(0).fromPairs().value());
      const filteredStats = () => (_(sortedStats()).toPairs().reject([1, 0]).fromPairs().value());

      if (_.sum(this.props.categoryStats) === 0) { return null; }

      return (
        <div className="catalog-landing-page-stats">
          <div className="stat-counts">
            {_.map(filteredStats(), (count, name) =>
              <CategoryStat
                key={name}
                name={_.get(I18n, `category_stats.${name}`, name)}
                count={count} />)}
          </div>
        </div>
      );
    };

    const spinner = <span className="spinner-default spinner-btn-primary" />;

    const isDirty = !_.isEqual(this.state.initialProps, this.props);

    return (
      <div className="clp-manager">
        <h1 className="header">{_.get(I18n, 'manager.manage_this_category')}</h1>
        <h2 className="error-message">{this.state.errorMessage}</h2>
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
              placeholder={formatWithCategory('manager.description.placeholder')}
              onChange={this.handleInputChange}
              value={this.props.header.description} />

            {headingHtml(formatWithCategory('manager.show_stats.label'))}
            <p className="small explanation">
              {_.get(I18n, 'manager.show_stats.explanation')}
            </p>
            {showStatsCheckbox()}
            {categoryStats()}

            {headingHtml(formatWithCategory('manager.featured_content.label'))}
            <p className="small explanation">
              {_.get(I18n, 'manager.featured_content.explanation')}
            </p>
            <FeaturedContentManager category={this.props.category} />
          </form>
        </div>

        <footer>
          <div>
            <button className="btn btn-default" onClick={this.onDismiss}>
              {isDismissing ? spinner : _.get(I18n, 'manager.cancel')}
            </button>
            &nbsp;
            <button className="btn btn-primary" onClick={this.handleSave} disabled={!isDirty}>
              {isSaving ? spinner : _.get(I18n, 'manager.save')}
            </button>
          </div>
        </footer>
      </div>
    );
  }
}

Manager.propTypes = {
  category: PropTypes.string.isRequired,
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
  category: state.category,
  featuredContent: state.featuredContent,
  header: state.header
});

const mapDispatchToProps = dispatch => ({
  toggleStats: (checked) => dispatch(Actions.toggleStats(checked)),
  updateDescription: (text) => dispatch(Actions.updateDescription(text)),
  updateHeadline: (text) => dispatch(Actions.updateHeadline(text))
});

export default connect(mapStateToProps, mapDispatchToProps)(Manager);
