import React, { PropTypes } from 'react';

var DownloadDropdown = React.createClass({
  propTypes: {
    onDownloadData: PropTypes.func,
    view: PropTypes.object.isRequired
  },

  renderDownloadLink: function(format, callback) {
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

  render: function() {
    var { onDownloadData, view } = this.props;

    if (view.downloadOverride) {
      return (
        <a href={view.downloadOverride} className="btn btn-simple btn-sm download">
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
