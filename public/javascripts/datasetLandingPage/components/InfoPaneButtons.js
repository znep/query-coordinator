import React, { PropTypes } from 'react';

export default React.createClass({
  propTypes: {
    view: PropTypes.object.isRequired,
    onDownloadData: PropTypes.func,
    onClickGrid: PropTypes.func
  },

  renderViewDataButton() {
    const { view, onClickGrid } = this.props;

    if (view.isBlobby || view.isHref) {
      return null;
    } else {
      return (
        <a
          href={view.gridUrl}
          id="tour-anchor"
          className="btn btn-simple btn-sm unstyled-link grid"
          onClick={onClickGrid}>
          {I18n.action_buttons.data}
          <span className="icon-external" />
        </a>
      );
    }
  },

  renderManageButton() {
    const { view } = this.props;

    if (view.isBlobby || view.isHref) {
      return (
        <a
          href={`${view.gridUrl}?pane=manage`}
          className="btn btn-simple btn-sm unstyled-link manage">
          {I18n.manage_dataset}
        </a>
      );
    } else {
      return null;
    }
  },

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
  },

  renderDownloadDropdown() {
    const { onDownloadData, view } = this.props;
    const overrideLink = _.get(view.metadata, 'overrideLink');

    // Special cases for different view types and download overrides
    if (view.isHref) {
      return null;
    } else if (view.isBlobby) {
      return (
        <a
          href={`/api/file_data/${view.blobId}?filename=${view.blobFilename}`}
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
  },

  renderApiButton() {
    const { view } = this.props;

    if (view.isBlobby || view.isHref) {
      return null;
    } else {
      return (
        <button className="btn btn-simple btn-sm api" data-flannel="api-flannel" data-toggle>
          {I18n.action_buttons.api}
        </button>
      );
    }
  },

  renderShareButton() {
    return (
      <button className="btn btn-simple btn-sm share" data-modal="share-modal">
        {I18n.action_buttons.share}
      </button>
    );
  },

  renderMoreActions() {
    const { view } = this.props;

    const contactFormLink = (
      <li>
        <a tabIndex="0" role="button" className="option" data-modal="contact-form">
          {I18n.action_buttons.contact_owner}
        </a>
      </li>
    );

    const commentLink = view.commentUrl ? (
      <li>
        <a className="option" href={view.commentUrl}>
          {I18n.action_buttons.comment}
        </a>
      </li>
    ) : null;

    const odataLink = (view.isBlobby || view.isHref) ? null : (
      <li>
        <a tabIndex="0" role="button" className="option" data-modal="odata-modal">
          {I18n.action_buttons.odata}
        </a>
      </li>
    );

    return (
      <div className="btn btn-simple btn-sm dropdown more" data-dropdown data-orientation="bottom">
        <span aria-hidden className="icon-waiting"></span>
        <ul className="dropdown-options">
          {contactFormLink}
          {commentLink}
          {odataLink}
        </ul>
      </div>
    );
  },

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
});
