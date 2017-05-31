import $ from 'jquery';
import _ from 'lodash';
import classNames from 'classnames';
import React from 'react';
import { connect } from 'react-redux';

import Visualization from '../../components/Visualization';

import { setCenterAndZoom, setDimensionLabelAreaSize } from '../actions';
import {
  hasVisualizationType,
  hasVisualizationDimension,
  isTimelineChart,
  isValidTimelineChartVif,
  isFeatureMap,
  isValidFeatureMapVif,
  isBarChart,
  isValidBarChartVif,
  isColumnChart,
  isValidColumnChartVif,
  isPieChart,
  isValidPieChartVif,
  isHistogram,
  isValidHistogramVif,
  isRegionMap,
  isValidRegionMapVif,
  getCurrentVif,
  isInsertableVisualization
} from '../selectors/vifAuthoring';

export var VisualizationPreview = React.createClass({
  propTypes: {
    vif: React.PropTypes.object,
    vifAuthoring: React.PropTypes.object
  },

  componentDidMount() {
    $(this.visualizationPreview).
      on('SOCRATA_VISUALIZATION_MAP_CENTER_AND_ZOOM_CHANGED', this.onCenterAndZoomChanged);
    $(this.visualizationPreview).
      on('SOCRATA_VISUALIZATION_DIMENSION_LABEL_AREA_SIZE_CHANGED', this.onDimensionLabelAreaSizeChanged);
  },

  componentWillUnmount() {
    $(this.visualizationPreview).
      off('SOCRATA_VISUALIZATION_MAP_CENTER_AND_ZOOM_CHANGED', this.onCenterAndZoomChanged);
    $(this.visualizationPreview).
      off('SOCRATA_VISUALIZATION_DIMENSION_LABEL_AREA_SIZE_CHANGED', this.onDimensionLabelAreaSizeChanged);
  },

  shouldComponentUpdate(nextProps) {
    const { vif } = this.props;
    const vifChanged = !_.isEqual(vif, nextProps.vif);

    // Our SVG maps mutate VIFs run internal state for map center and zoom which is
    // intercepted through an event. We're interested in saving this data, but we
    // don't have to re-render when it happens because the visualization code takes
    // care of that for us.
    const nextMapCenterAndZoom = _.get(nextProps.vif, 'configuration.mapCenterAndZoom');
    const mapCenterAndZoom = _.get(vif, 'configuration.mapCenterAndZoom');

    return vifChanged && _.isEqual(mapCenterAndZoom, nextMapCenterAndZoom);
  },

  onCenterAndZoomChanged(event) {
    const centerAndZoom = _.get(event, 'originalEvent.detail');
    this.props.onCenterAndZoomChanged(centerAndZoom);
  },

  onDimensionLabelAreaSizeChanged(event) {
    const width = _.get(event, 'originalEvent.detail');
    if (_.isFinite(width)) {
      this.props.onDimensionLabelAreaSizeChanged(width);
    }
  },

  isVifValid() {
    const { vifAuthoring } = this.props;

    const isValidBarChart = isBarChart(vifAuthoring) && isValidBarChartVif(vifAuthoring);
    const isValidColumnChart = isColumnChart(vifAuthoring) && isValidColumnChartVif(vifAuthoring);
    const isValidTimelineChart = isTimelineChart(vifAuthoring) && isValidTimelineChartVif(vifAuthoring);
    const isValidPieChart = isPieChart(vifAuthoring) && isValidPieChartVif(vifAuthoring);
    const isValidFeatureMap = isFeatureMap(vifAuthoring) && isValidFeatureMapVif(vifAuthoring);
    const isValidRegionMap = isRegionMap(vifAuthoring) && isValidRegionMapVif(vifAuthoring);
    const isValidHistogram = isHistogram(vifAuthoring) && isValidHistogramVif(vifAuthoring);

    return isValidBarChart ||
      isValidColumnChart ||
      isValidTimelineChart ||
      isValidPieChart ||
      isValidFeatureMap ||
      isValidRegionMap ||
      isValidHistogram;
  },

  renderVisualization() {
    const { vif, vifAuthoring } = this.props;
    const hasType = hasVisualizationType(vifAuthoring);
    const hasDimension = hasVisualizationDimension(vifAuthoring);

    return hasType && hasDimension && this.isVifValid() ?
      <Visualization vif={vif} /> :
      null;
  },

  render() {
    const previewClasses = classNames('visualization-preview', {
      'visualization-preview-rendered': isInsertableVisualization(this.props.vifAuthoring)
    });

    return (
      <div className={previewClasses} ref={(ref) => this.visualizationPreview = ref}>
        {this.renderVisualization()}
      </div>
    );
  }
});

function mapStateToProps(state) {
  return {
    vifAuthoring: state.vifAuthoring,
    vif: getCurrentVif(state.vifAuthoring)
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onCenterAndZoomChanged(centerAndZoom) {
      dispatch(setCenterAndZoom(centerAndZoom));
    },
    onDimensionLabelAreaSizeChanged(width) {
      dispatch(setDimensionLabelAreaSize(width));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(VisualizationPreview);
