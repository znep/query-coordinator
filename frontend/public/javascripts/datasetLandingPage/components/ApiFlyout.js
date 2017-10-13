import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { Flyout, FlyoutHeader, FlyoutContent } from './Flyout';
import ResourceToggle from './ResourceToggle';

class ApiFlyout extends Component {
  getResourceTypes() {
    const { view } = this.props;
    const resourceTypes = [];

    resourceTypes.push({
      label: I18n.api_modal.json,
      url: view.resourceUrl,
      defaultType: _.isEmpty(view.namedResourceUrl)
    });

    if (!_.isEmpty(view.namedResourceUrl)) {
      resourceTypes.push({
        label: I18n.api_modal.name,
        url: view.namedResourceUrl,
        defaultType: true
      });
    }

    if (view.geoJsonResourceUrl) {
      resourceTypes.push({
        label: I18n.api_modal.geojson,
        url: view.geoJsonResourceUrl
      });
    }

    resourceTypes.push({
      label: I18n.api_modal.csv,
      url: view.csvResourceUrl
    });

    return resourceTypes;
  }

  shouldRender() {
    const { view, isMobile, isTablet } = this.props;

    const isBlobbyOrHref = view.isBlobby || view.isHref;
    const shouldDontRender = isMobile || isTablet;

    return !(isBlobbyOrHref || shouldDontRender);
  }

  renderFoundryLinks() {
    const { view } = this.props;
    const enableDatasetLandingPageFoundryLinks =
      serverConfig.featureFlags.enable_dataset_landing_page_foundry_links;

    if (!enableDatasetLandingPageFoundryLinks) {
      return null;
    }

    return (
      <div className="section">
        <a
          className="btn btn-default btn-sm documentation-link"
          href={view.apiFoundryUrl}
          target="_blank">
          <span className="icon-copy-document" />
          {I18n.api_modal.foundry_button}
        </a>
        <a
          className="btn btn-default btn-sm documentation-link"
          href="https://dev.socrata.com"
          target="_blank">
          <span className="icon-settings" />
          {I18n.api_modal.developer_portal_button}
        </a>
      </div>
    );
  }

  renderEndpoint() {
    const toggleProps = {
      types: this.getResourceTypes(),
      section: 'api',
      title: I18n.api_modal.endpoint_title
    };

    return <ResourceToggle {...toggleProps} />;
  }

  render() {
    if (!this.shouldRender()) {
      return null;
    }

    const targetElement = (
      <span aria-hidden className="btn btn-simple btn-sm">
        {I18n.action_buttons.api}
      </span>
    );
    const flyoutProps = {
      position: 'left',
      trigger: 'click',
      className: 'btn-container api-flyout',
      targetElement
    };

    return (
      <Flyout {...flyoutProps}>
        <FlyoutHeader
          title={I18n.api_modal.title}
          description={I18n.api_modal.description} />
        <FlyoutContent>
          {this.renderFoundryLinks()}
          {this.renderEndpoint()}
        </FlyoutContent>
      </Flyout>
    );
  }
}

ApiFlyout.propTypes = {
  view: PropTypes.object.isRequired,
  isTablet: PropTypes.bool,
  isMobile: PropTypes.bool
};

export default ApiFlyout;
