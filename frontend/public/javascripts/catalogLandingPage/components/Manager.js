import 'whatwg-fetch';
import _ from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { defaultHeaders } from '../../common/http';
import { handleEnter } from '../../common/helpers/keyPressHelpers';
import format from 'stringformat';
import FeaturedContentManager from './FeaturedContentManager';
import ManagerSectionHeader from './ManagerSectionHeader';
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
      'handleSave',
      'saveOnEnter'
    ]);
  }

  onDismiss() {
    this.setState({ isDismissing: true });
    window.location.href = this.props.catalogPath;
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
        // A redirect will be seen if the session has expired and we get redirected to the login page.
        // Unfortunately, fetch does not set the status to 302 in this case, but instead sets it to 0
        // so we have to look in the response.type instead.
        if (response.status === 401 || response.status === 302 || response.type === 'opaqueredirect') {
          const loginWarningKey = 'manager.you_must_login_first';
          const loginWarning = _.get(I18n, loginWarningKey);
          if (!loginWarning) {
            console.error(`Error retrieving I18n message for key: ${loginWarningKey}`);
          }
          return this.setState({ errorMessage: loginWarning });
        }
        // It possible to see a 403 if the user formerly had permissions, but they have subsequently been
        // revoked. Rather than showing a "something went wrong", let's show them a real error message.
        if (response.status === 403) {
          const permissionWarningKey = 'manager.you_are_not_authorized';
          const permissionWarning = _.get(I18n, permissionWarningKey);
          if (!permissionWarning) {
            console.error(`Error retrieving I18n message for key: ${permissionWarningKey}`);
          }
          return this.setState({ errorMessage: permissionWarning });
        }

        return response.text().then((text) => {
          handleException(text);
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
        _.get(I18n, `manager.view_types.${filterValue}`, null) :
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

    return (
      <div className="clp-manager">
        <h1 className="header">{_.get(I18n, 'manager.feature_content')}</h1>
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
            <textarea
              {...metadataInputProps('description')}
              aria-label={formatWithFilter('manager.description.placeholder',
                'manager.description.placeholder_no_filter')}
              maxLength="320"
              placeholder={formatWithFilter('manager.description.placeholder',
                'manager.description.placeholder_no_filter')} />

            <ManagerSectionHeader className="featured-content-header">
              {formatWithFilter('manager.featured_content.label', 'manager.featured_content.label_no_filter')}
            </ManagerSectionHeader>
            <p className="small explanation">
              {_.get(I18n, 'manager.featured_content.explanation')}
            </p>
            <FeaturedContentManager />
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
