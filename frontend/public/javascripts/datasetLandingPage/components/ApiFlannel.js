import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { Flannel, FlannelHeader, FlannelContent } from 'common/components/Flannel';
import ResourceToggle from './ResourceToggle';

class ApiFlannel extends Component {
  constructor(props) {
    super(props);

    this.state = {
      flannelOpen: props.flannelOpen
    };

    _.bindAll(this, ['closeFlannel', 'openFlannel']);
  }

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

  closeFlannel() {
    this.setState({ flannelOpen: false });
  }

  openFlannel() {
    this.setState({ flannelOpen: true });
  }

  shouldRender() {
    const { view } = this.props;

    const isBlobbyOrHref = view.isBlobby || view.isHref;

    return !isBlobbyOrHref;
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
    const { onClickCopy } = this.props;

    const toggleProps = {
      types: this.getResourceTypes(),
      section: 'api',
      title: I18n.api_modal.endpoint_title,
      onClickCopy
    };

    return <ResourceToggle {...toggleProps} />;
  }

  renderTarget() {
    const { isMobile, isTablet } = this.props;

    const targetProps = {
      ref: ref => this.targetElement = ref,
      onClick: this.openFlannel
    };

    if (isMobile || isTablet) {
      return (
        <a {...targetProps}>
          {I18n.action_buttons.api}
        </a>
      );
    } else {
      const extraProps = {
        className: 'btn btn-simple btn-sm',
        'aria-hidden': true
      };

      return (
        <span {..._.merge(targetProps, extraProps)}>
          {I18n.action_buttons.api}
        </span>
      );
    }
  }

  renderFlannel() {
    const flannelProps = {
      id: 'api-flannel',
      className: 'api-flannel',
      target: () => this.targetElement,
      title: I18n.api_modal.title,
      onDismiss: this.closeFlannel
    };

    const flannelHeaderProps = {
      title: I18n.api_modal.title,
      onDismiss: this.closeFlannel
    };

    return (
      <Flannel {...flannelProps}>
        <FlannelHeader {...flannelHeaderProps} />
        <FlannelContent>
          <div>
            {I18n.api_modal.description}
          </div>
          {this.renderFoundryLinks()}
          {this.renderEndpoint()}
        </FlannelContent>
      </Flannel>
    );
  }

  render() {
    const { isMobile, isTablet } = this.props;

    if (!this.shouldRender()) {
      return null;
    }

    if (isMobile || isTablet) {
      return (
        <li>
          {this.renderTarget()}
          {this.state.flannelOpen && this.renderFlannel()}
        </li>
      );
    } else {
      return (
        <div className="btn-container">
          {this.renderTarget()}
          {this.state.flannelOpen && this.renderFlannel()}
        </div>
      );
    }
  }
}

ApiFlannel.defaultProps = {
  flannelOpen: false
};

ApiFlannel.propTypes = {
  onClickCopy: PropTypes.func.isRequired,
  view: PropTypes.object.isRequired,
  isTablet: PropTypes.bool,
  isMobile: PropTypes.bool,
  flannelOpen: PropTypes.bool
};

export default ApiFlannel;
