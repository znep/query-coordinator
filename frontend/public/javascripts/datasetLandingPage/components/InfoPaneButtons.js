import React, { PropTypes, Component } from 'react';

import { isUserRoled } from '../../common/user';
import { localizeLink } from '../../common/locale';

export default class InfoPaneButtons extends Component {
  componentDidMount() {
    window.addEventListener('resize', this.alignActionButtons);
  }

  componentWillUpdate(nextProps) {
    const { isMobile, isTablet } = nextProps;
    const apiBtn = document.querySelector('.entry-actions .api');
    const apiLink = document.querySelector('.entry-actions .api-link');

    if (apiBtn && apiLink) {
      if (isMobile || isTablet) {
        apiBtn.classList.add('hidden');
        apiLink.classList.remove('hidden');
      } else {
        apiBtn.classList.remove('hidden');
        apiLink.classList.add('hidden');
      }
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.alignActionButtons);
  }

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

  renderViewDataButton() {
    const { view, onClickGrid } = this.props;
    const isBlobbyOrHref = view.isBlobby || view.isHref;

    if (isBlobbyOrHref) {
      return null;
    }

    return (
      <a
        href={localizeLink(view.gridUrl)}
        className="btn btn-simple btn-sm unstyled-link grid"
        onClick={onClickGrid}>
        {I18n.action_buttons.data}
      </a>
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

  renderDownloadLink(format, callback) {
    const { view } = this.props;
    let extension = format;
    let type = format.toUpperCase();
    const params = {
      accessType: 'DOWNLOAD'
    };

    if (format === 'csv_for_excel') {
      extension = 'csv';
      type = 'CSV for Excel';
      params.bom = 'true';
      params.format = 'true';
    }

    if (format === 'csv_for_excel_europe') {
      extension = 'csv';
      type = 'CSV for Excel (Europe)';
      params.bom = 'true';
      params.format = 'true';
      params.delimiter = ';';
    }

    if (format === 'tsv_for_excel') {
      extension = 'tsv';
      type = 'TSV for Excel';
      params.bom = 'true';
    }

    // Construct the query string, url, and label
    const queryString = $.param(params);
    const url = `/api/views/${view.id}/rows.${extension}?${queryString}`;
    const label = I18n.download[format] || format.toUpperCase();

    return (
      <li key={format}>
        <a role="menuitem" href={url} data-type={type} onClick={callback}>
          {label}
        </a>
      </li>
    );
  }

  renderDownloadDropdown() {
    const { onDownloadData, view } = this.props;
    const overrideLink = _.get(view.metadata, 'overrideLink');

    // Special cases for different view types and download overrides
    if (view.isHref) {
      return null;
    } else if (view.isBlobby) {
      return (
        <a
          href={`/api/views/${view.id}/files/${view.blobId}?filename=${view.blobFilename}`}
          className="btn btn-simple btn-sm unstyled-link download"
          target="_blank">
          {I18n.action_buttons.download}
        </a>
      );
    } else if (overrideLink) {
      return (
        <a href={overrideLink} className="btn btn-simple btn-sm unstyled-link download">
          {I18n.action_buttons.download}
        </a>
      );
    } else {
      const exportLinks = _.map(view.exportFormats, (format) =>
        this.renderDownloadLink(format, onDownloadData)
      );

      return (
        <div
          className="dropdown btn btn-simple download btn-sm"
          data-dropdown
          data-orientation="bottom">
          <span aria-hidden>{I18n.action_buttons.download}</span>
          <ul role="menu" aria-label={I18n.action_buttons.download} className="dropdown-options">
            {exportLinks}
          </ul>
        </div>
      );
    }
  }

  renderApiButton() {
    const { view } = this.props;
    const isBlobbyOrHref = view.isBlobby || view.isHref;

    if (isBlobbyOrHref) {
      return null;
    }

    return (
      <button className="btn btn-simple btn-sm api" data-flannel="api-flannel" data-toggle>
        {I18n.action_buttons.api}
      </button>
    );
  }

  renderShareButton() {
    return (
      <button className="btn btn-simple btn-sm share" data-modal="share-modal">
        {I18n.action_buttons.share}
      </button>
    );
  }

  renderMoreActions() {
    const { view } = this.props;
    const isBlobbyOrHref = view.isBlobby || view.isHref;

    const { enableVisualizationCanvas } = serverConfig.featureFlags;
    const canCreateVisualizationCanvas = enableVisualizationCanvas &&
      isUserRoled() &&
      _.isString(view.bootstrapUrl);

    let visualizeLink = null;
    if (!isBlobbyOrHref && canCreateVisualizationCanvas) {
      visualizeLink = (
        <li>
          <a tabIndex="0" role="button" className="option" href={localizeLink(view.bootstrapUrl)}>
            {I18n.action_buttons.visualize}
          </a>
        </li>
      );
    }

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

    let apiLink = null;
    if (!isBlobbyOrHref) {
      apiLink = (
        <li>
          <a tabIndex="0" role="button" className="option api-link" data-flannel="api-flannel">
            {I18n.action_buttons.api}
          </a>
        </li>
      );
    }

    return (
      <div className="btn btn-simple btn-sm dropdown more" data-dropdown data-orientation="bottom">
        <span aria-hidden className="icon-waiting"></span>
        <ul className="dropdown-options">
          {visualizeLink}
          {contactFormLink}
          {commentLink}
          {odataLink}
          {apiLink}
        </ul>
      </div>
    );
  }

  render() {
    return (
      <div className="btn-group">
        {this.renderViewDataButton()}
        {this.renderManageButton()}
        {this.renderDownloadDropdown()}
        {this.renderApiButton()}
        {this.renderShareButton()}
        {this.renderMoreActions()}
      </div>
    );
  }
}

InfoPaneButtons.propTypes = {
  view: PropTypes.object.isRequired,
  onDownloadData: PropTypes.func,
  onClickGrid: PropTypes.func,
  isDesktop: PropTypes.bool,
  isTablet: PropTypes.bool,
  isMobile: PropTypes.bool
};
