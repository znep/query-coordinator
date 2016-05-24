import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { findDOMNode } from 'react-dom';
import { emitMixpanelEvent } from '../actions';

function generateDownloadLink(view, format, className) {
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
      <a href={url} data-type={type}>
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
      <a href={url} data-type={format}>
        {label}
      </a>
    </li>
  );
}

export var DownloadDropdown = React.createClass({
  propTypes: {
    view: PropTypes.object.isRequired
  },

  componentDidMount: function() {
    // We unfortunately have to watch for clicks here because the styleguide breaks
    // React's onClick handler when it turns this component into a dropdown.
    $(findDOMNode(this)).find('a').click(this.props.onClickOption);
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
      <div className="dropdown btn btn-default download btn-sm" data-dropdown data-orientation="bottom">
        {I18n.action_buttons.download}
        <ul className="dropdown-options">
          {exportLinks}
        </ul>
      </div>
    );
  }
});

function mapDispatchToProps(dispatch) {
  return {
    onClickOption: function(event) {
      var payload = {
        name: 'Downloaded Data',
        properties: {
          'Type': event.target.dataset.type
        }
      };

      dispatch(emitMixpanelEvent(payload));
    }
  };
}

export default connect(_.identity, mapDispatchToProps)(DownloadDropdown);
