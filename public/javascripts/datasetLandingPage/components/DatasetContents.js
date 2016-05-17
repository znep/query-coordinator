import _ from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import RowDetails from './RowDetails';
import SchemaPreview from './SchemaPreview';

export var DatasetContents = React.createClass({
  propTypes: {
    view: PropTypes.object.isRequired
  },

  render: function() {
    var { view } = this.props;

    var views, showAsLayer;
    if (view.isGeospatial) {
      views = view.geospatialChildLayers;
      showAsLayer = view.geospatialChildLayers.length > 1;
    } else {
      views = [ view ];
      showAsLayer = false;
    }

    views = views.map(function(subview) {
      return [
        <RowDetails view={subview} showAsLayer={showAsLayer} />,
        <SchemaPreview view={subview} showAsLayer={showAsLayer} />
      ];
    });

    var multipleGeoLayerNotice;
    if (view.isGeospatial && view.geospatialChildLayers.length > 1) {
      multipleGeoLayerNotice = (
        <section className="landing-page-section">
          <div className="alert info">
            {I18n.multiple_geo_layers}
          </div>
        </section>
      );
    }

    return (
      <div>
        {multipleGeoLayerNotice}
        {views}
      </div>
    );
  }
});

function mapStateToProps(state) {
  return _.pick(state, 'view');
}

export default connect(mapStateToProps)(DatasetContents);
