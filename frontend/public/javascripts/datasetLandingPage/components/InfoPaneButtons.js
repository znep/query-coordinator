import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { localizeLink } from 'common/locale';
import { FeatureFlags } from 'common/feature_flags';

import ExportFlannel from './ExportFlannel';
import ApiFlannel from './ApiFlannel';
import ShareFlannel from './ShareFlannel';
import ODataModal from './ODataModal';

export default class InfoPaneButtons extends Component {

  constructor(props) {
    super(props);

    this.state = {
      shareFlannelOpen: false
    };
  }

  componentDidMount() {
    window.addEventListener('resize', this.alignActionButtons);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.alignActionButtons);
  }

  openShareFlannel = () => {
    this.setState({ shareFlannelOpen: true });
  };

  closeShareFlannel = (event) => {
    if (event && !event.target.classList.contains('share-link')) {
      this.setState({ shareFlannelOpen: false });
    }
  };
  // If the Infopane action buttons break onto the next line we
  // want to left-align the set of buttons to be directly under the title
  alignActionButtons() {
    const infoPaneTitle = document.querySelector('.entry-title');
    const infoPaneBtns = document.querySelector('.entry-actions');

    if (infoPaneTitle && infoPaneBtns) {
      if (infoPaneBtns.offsetTop > infoPaneTitle.offsetTop) {
        infoPaneBtns.classList.add('align-left');
      } else {
        infoPaneBtns.classList.remove('align-left');
      }
    }
  }

  renderVisualizeAndFilterLink() {
    const { view, onClickVisualizeAndFilter } = this.props;
    const isBlobbyOrHref = view.isBlobby || view.isHref;

    const vizCanvasEnabled = FeatureFlags.value('enable_visualization_canvas');
    const canCreateVisualizationCanvas = vizCanvasEnabled &&
      _.isString(view.bootstrapUrl);

    if (isBlobbyOrHref || !canCreateVisualizationCanvas) {
      return null;
    }

    return (
      <li>
        <a
          tabIndex="0"
          role="button"
          data-id={view.id}
          className="option"
          href={view.bootstrapUrl}
          onClick={onClickVisualizeAndFilter}>
          {I18n.explore_data.create_visualization}
        </a>
      </li>
    );
  }

  renderViewDataButton() {
    const { view, onClickGrid } = this.props;
    const isBlobbyOrHref = view.isBlobby || view.isHref;

    if (isBlobbyOrHref) {
      return null;
    }

    return (
      <a
        className="btn btn-primary btn-sm view-data"
        href={localizeLink(view.gridUrl)} onClick={onClickGrid}>
        {I18n.explore_data.view_data}
      </a>
    );
  }

  renderOpenInCartoLink() {
    const { view } = this.props;

    if (!view.cartoUrl) {
      return null;
    }

    return (
      <li key="carto">
        <a role="menuitem" data-modal="carto-modal">
          {I18n.explore_data.openin_carto}
        </a>
      </li>
    );
  }

  renderOpenInPlotlyLink() {
    return (
      <li key="plotly">
        <a role="menuitem" data-modal="plotly-modal">
          {I18n.explore_data.openin_plotly}
        </a>
      </li>
    );
  }

  renderExternalIntegrations() {
    const externalDataIntegrationsEnabled =
      FeatureFlags.value('enable_external_data_integrations');

    if (!externalDataIntegrationsEnabled) {
      return [];
    }

    const listItems = [];

    listItems.push(
      <li key="separator" className="openin-separator">
        {I18n.explore_data.openin_separator}
      </li>
    );

    listItems.push(this.renderOpenInCartoLink());
    listItems.push(this.renderOpenInPlotlyLink());

    listItems.push(
      <li key="more">
        <a
          className="more-options-button"
          href="https://support.socrata.com/hc/en-us/articles/115010730868">
          {I18n.explore_data.more}
        </a>
      </li>
    );

    return listItems;
  }

  renderExploreDataDropdown() {
    const { view } = this.props;
    if (view.isBlobby || view.isHref) {
      return null;
    }

    return (
      <div
        className="dropdown explore-dropdown btn btn-simple btn-sm"
        data-dropdown
        data-orientation="bottom">
        <span className="btn-label" aria-hidden>{I18n.action_buttons.visualize}</span>
        <span className="icon icon-arrow-down" />
        <ul role="menu" aria-label={I18n.action_buttons.visualize} className="dropdown-options">
          {this.renderVisualizeAndFilterLink()}
          {this.renderExternalIntegrations()}
        </ul>
      </div>
    );
  }

  renderManageButton() {
    const { view } = this.props;
    const isBlobbyOrHref = view.isBlobby || view.isHref;

    if (!isBlobbyOrHref) {
      return null;
    }

    return (
      <a
        href={`${localizeLink(view.gridUrl)}?pane=manage`}
        className="btn btn-simple btn-sm unstyled-link manage">
        {I18n.manage_dataset}
      </a>
    );
  }

  renderMoreActions() {
    const { view, onWatchDatasetFlagClick, isMobile, isTablet } = this.props;
    const isBlobbyOrHref = view.isBlobby || view.isHref;

    const contactFormLink = !view.disableContactDatasetOwner ? (
      <li>
        <a tabIndex="0" role="button" className="option" data-modal="contact-form">
          {I18n.action_buttons.contact_owner}
        </a>
      </li>
    ) : null;

    const commentLink = view.commentUrl ? (
      <li>
        <a className="option" href={localizeLink(view.commentUrl)}>
          {I18n.action_buttons.comment}
        </a>
      </li>
    ) : null;

    let odataLink = null;
    if (!isBlobbyOrHref) {
      odataLink = (
        <li>
          <a tabIndex="0" role="button" className="option" data-modal="odata-modal">
            {I18n.action_buttons.odata}
          </a>
        </li>
      );
    }

    let watchDatasetLink = null;
    const userNotificationsEnabled = FeatureFlags.value('enable_user_notifications') === true;

    if (_.get(window, 'sessionData.email', '') !== '' && userNotificationsEnabled) {
      const watchDatasetLinkText = view.subscribed ?
        I18n.action_buttons.unwatch_dataset :
        I18n.action_buttons.watch_dataset;

      watchDatasetLink = (
        <li>
          <a
            tabIndex="0"
            role="button"
            className="option watch-dataset-link"
            onClick={(event) => onWatchDatasetFlagClick(this.props, event)}>
            {watchDatasetLinkText}
          </a>
        </li>
      );
    }

    let apiLink = null;
    const enableDatasetLandingPageFoundryLinks =
      serverConfig.featureFlags.enable_dataset_landing_page_foundry_links;
    if (!isBlobbyOrHref && enableDatasetLandingPageFoundryLinks && (isMobile || isTablet)) {
      const apiLinkProps = {
        tabIndex: 0,
        role: 'button',
        className: 'option',
        href: view.apiFoundryUrl
      };
      apiLink = (
        <li>
          <a {...apiLinkProps}>{I18n.api_modal.foundry_button}</a>
        </li>
      );
    }

    const shareLinkProps = {
      className: 'option share-link',
      'aria-hidden': true,
      onClick: this.openShareFlannel
    };

    let shareLink = (
      <li>
        <a {...shareLinkProps}>
          {I18n.action_buttons.share}
        </a>
      </li>
    );

    return (
      <div
        className="btn btn-simple btn-sm dropdown more"
        onClick={(event) => this.closeShareFlannel(event)}
        data-dropdown data-orientation="bottom">
        <span aria-hidden className="icon-waiting"></span>
        <ul className="dropdown-options">
          {shareLink}
          {watchDatasetLink}
          {contactFormLink}
          {commentLink}
          {odataLink}
          {apiLink}
        </ul>
      </div>
    );
  }


  render() {
    const { view, isMobile, isTablet } = this.props;
    const { shareFlannelOpen } = this.state;

    const isBlobbyOrHref = view.isBlobby || view.isHref;
    const shouldApiLinkRender = !isBlobbyOrHref && !(isMobile || isTablet);
    let apiLink = null;
    let shareFlannel = null;
    // To show flannel under the more button
    let shareFlannelTargetElement = () => document.getElementsByClassName('dropdown more')[0];

    if (shareFlannelOpen) {
      shareFlannel = (
        <ShareFlannel
          {...this.props}
          flannelTargetElement={shareFlannelTargetElement}
          flannelOpen={shareFlannelOpen}
          onCloseShareFlannel={this.closeShareFlannel} />
      );
    }
    if (shouldApiLinkRender) {
      apiLink = <ApiFlannel {...this.props} />;
    }

    return (
      <div className="btn-group">
        {this.renderViewDataButton()}
        {this.renderExploreDataDropdown()}
        {this.renderManageButton()}
        <ExportFlannel {...this.props} />
        {apiLink}
        {shareFlannel}
        {this.renderMoreActions()}
        <ODataModal {...this.props} />
      </div>
    );
  }
}

InfoPaneButtons.propTypes = {
  view: PropTypes.object.isRequired,
  onDownloadData: PropTypes.func.isRequired,
  onClickShareOption: PropTypes.func.isRequired,
  onClickGrid: PropTypes.func,
  onClickVisualizeAndFilter: PropTypes.func,
  isDesktop: PropTypes.bool,
  isTablet: PropTypes.bool,
  isMobile: PropTypes.bool,
  onWatchDatasetFlagClick: PropTypes.func,
  onSubscriptionChange: PropTypes.func
};
