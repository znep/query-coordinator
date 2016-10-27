import React, { PropTypes } from 'react';

var DownloadDropdown = React.createClass({
  propTypes: {
    onDownloadData: PropTypes.func,
    view: PropTypes.object.isRequired
  },

  renderDownloadLink(format, callback) {
    var { view } = this.props;
    var extension = format;
    var type = format.toUpperCase();
    var params = {
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

    var queryString = _.toPairs(params).map(function(param) { return param.join('='); }).join('&');
    var url = `/api/views/${view.id}/rows.${extension}?${queryString}`;
    var label = I18n.download[format] || format.toUpperCase();

    return (
      <li key={format}>
        <a role="menuitem" href={url} data-type={type} onClick={callback}>
          {label}
        </a>
      </li>
    );
  },

  render() {
    var { onDownloadData, view } = this.props;
    const overrideLink = _.get(view.metadata, 'overrideLink');
    if (overrideLink) {
      return (
        <a href={overrideLink} className="btn btn-simple btn-sm unstyled-link download">
          {I18n.action_buttons.download}
        </a>
      );
    }

    if (view.isBlobby) {
      return (
        <a
          href={`/api/file_data/${view.blobId}?filename=${view.blobFilename}`}
          className="btn btn-simple btn-sm unstyled-link download"
          target="_blank">
          {I18n.action_buttons.download}
        </a>
      );
    }

    var exportLinks = _.map(view.exportFormats, (format) =>
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
});

export default DownloadDropdown;
