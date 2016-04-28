import React, { PropTypes } from 'react';

function generateDownloadLink(view, format, className) {
  var extension = format;
  var params = {
    accessType: 'DOWNLOAD'
  };

  if (format === 'csv_for_excel') {
    extension = 'csv';
    params.bom = 'true';
  }

  if (format === 'csv_without_geo') {
    extension = 'csv';
  }

  if (format === 'json_without_geo') {
    extension = 'json';
  }

  var queryString = _.pairs(params).map(function(param) { return param.join('='); }).join('&');
  var url = `/api/views/${view.id}/rows.${extension}?${queryString}`;
  var label = I18n.download[format] || format.toUpperCase();

  return (
    <li key={format} className={className}>
      <a href={url}>
        {label}
      </a>
    </li>
  );
}

function generateGeoDownloadLink(view, format) {
  var url = `/api/geospatial/${view.id}?method=export&format=${format}`;
  var label = I18n.download[format.toLowerCase()] || format;

  return (
    <li key={format}>
      <a href={url}>
        {label}
      </a>
    </li>
  );
}

var DownloadDropdown = React.createClass({
  propTypes: {
    view: PropTypes.object.isRequired
  },

  render: function() {
    var { view } = this.props;

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
          generateDownloadLink(view, 'csv_without_geo'),
          generateDownloadLink(view, 'json_without_geo')
        ]);
      } else if (view.geospatialChildLayers.length > 1) {
        exportLinks = exportLinks.concat(view.geospatialChildLayers.map(function(childLayer) {
          return [
            <div>
              <li className="geo-layer-heading">{childLayer.name}</li>
              {generateDownloadLink(childLayer, 'csv_without_geo', 'geo-layer-export')}
              {generateDownloadLink(childLayer, 'json_without_geo', 'geo-layer-export')}
            </div>
          ];
        }));
      }
    } else {
      exportLinks = _.map(view.exportFormats, function(format) {
        return generateDownloadLink(view, format);
      });
    }

    return (
      <button className="dropdown btn btn-default download btn-sm" data-dropdown data-orientation="bottom">
        {I18n.action_buttons.download}
        <ul className="dropdown-options">
          {exportLinks}
        </ul>
      </button>
    );
  }
});

export default DownloadDropdown;
