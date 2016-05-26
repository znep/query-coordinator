import React, { PropTypes } from 'react';

function generateDownloadLink(view, format, className, callback) {
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

  if (format === 'csv_without_geo') {
    extension = 'csv';
    type = 'CSV (without geospatial data)';
  }

  if (format === 'json_without_geo') {
    extension = 'json';
    type = 'JSON (without geospatial data)';
  }

  var queryString = _.pairs(params).map(function(param) { return param.join('='); }).join('&');
  var url = `/api/views/${view.id}/rows.${extension}?${queryString}`;
  var label = I18n.download[format] || format.toUpperCase();

  return (
    <li key={format} className={className}>
      <a href={url} data-type={type} onClick={callback}>
        {label}
      </a>
    </li>
  );
}

function generateGeoDownloadLink(view, format, callback) {
  var url = `/api/geospatial/${view.id}?method=export&format=${format}`;
  var label = I18n.download[format.toLowerCase()] || format;

  return (
    <li key={format}>
      <a href={url} data-type={format} onClick={callback}>
        {label}
      </a>
    </li>
  );
}

var DownloadDropdown = React.createClass({
  propTypes: {
    onDownloadData: PropTypes.func,
    view: PropTypes.object.isRequired
  },

  render: function() {
    var { onDownloadData, view } = this.props;

    if (view.downloadOverride) {
      return (
        <a href={view.downloadOverride} className="btn btn-default btn-sm download">
          {I18n.action_buttons.download}
        </a>
      );
    }

    var exportLinks;
    if (view.isGeospatial) {
      exportLinks = _.map(view.exportFormats, function(format) {
        return generateGeoDownloadLink(view, format);
      });

      if (view.geospatialChildLayers.length === 1) {
        exportLinks = exportLinks.concat([
          generateDownloadLink(view, 'csv_without_geo', null, onDownloadData),
          generateDownloadLink(view, 'json_without_geo', null, onDownloadData)
        ]);
      } else if (view.geospatialChildLayers.length > 1) {
        exportLinks = exportLinks.concat(view.geospatialChildLayers.map(function(childLayer) {
          return [
            <div>
              <li className="geo-layer-heading">{childLayer.name}</li>
              {generateDownloadLink(childLayer, 'csv_without_geo', 'geo-layer-export', onDownloadData)}
              {generateDownloadLink(childLayer, 'json_without_geo', 'geo-layer-export', onDownloadData)}
            </div>
          ];
        }));
      }
    } else {
      exportLinks = _.map(view.exportFormats, function(format) {
        return generateDownloadLink(view, format, null, onDownloadData);
      });
    }

    return (
      <div className="dropdown btn btn-default download btn-sm" data-dropdown data-orientation="bottom">
        {I18n.action_buttons.download}
        <ul className="dropdown-options">
          {exportLinks}
        </ul>
      </div>
    );
  }
});

export default DownloadDropdown;
