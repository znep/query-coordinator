import $ from 'jquery';
import _ from 'lodash';
import classNames from 'classnames';
import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';

import '../../views/SvgHistogram';
import '../../views/SvgColumnChart';
import '../../views/SvgTimelineChart';
import '../../views/SvgFeatureMap';
import '../../views/SvgRegionMap';

import { translate } from '../../I18n';
import { requestCenterAndZoom } from '../actions';
import {
  hasVisualizationType,
  getDimension,
  getMeasure,
  isInsertableVisualization,
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
  isRenderableMap
} from '../selectors/vifAuthoring';

export var Visualization = React.createClass({
  propTypes: {
    vif: React.PropTypes.object,
    vifAuthoring: React.PropTypes.object
  },

  getInitialState() {
    return {
      hasRenderedVisualization: false
    };
  },

  componentDidMount() {
    this.renderVisualization();
  },

  componentDidUpdate() {
    this.renderVisualization();
  },

  shouldComponentUpdate(nextProps) {
    const { vif, vifAuthoring } = this.props;
    const { showCenteringAndZoomingSaveMessage } = nextProps.vifAuthoring.authoring;
    const vifChanged = !_.isEqual(vif, nextProps.vif);

    return vifChanged || vifAuthoring.authoring.showCenteringAndZoomingSaveMessage !== showCenteringAndZoomingSaveMessage;
  },

  onCenterAndZoomChanged(event) {
    const centerAndZoom = _.get(event, 'originalEvent.detail');

    this.props.onCenterAndZoomChanged(centerAndZoom);
  },

  visualizationPreview() {
    return ReactDOM.findDOMNode(this).querySelector('.visualization-preview');
  },

  updateVisualization() {

    this.visualizationPreview().dispatchEvent(
      new CustomEvent(
        'SOCRATA_VISUALIZATION_RENDER_VIF',
        {
          detail: this.props.vif,
          bubbles: true
        }
      )
    );
  },

  destroyVisualizationPreview() {
    $(this.visualizationPreview()).
      trigger('SOCRATA_VISUALIZATION_DESTROY').
      off('SOCRATA_VISUALIZATION_MAP_CENTER_AND_ZOOM_CHANGED', this.onCenterAndZoomChanged);
  },

  barChart() {
    const { vif } = this.props;
    const $visualizationPreview = $(this.visualizationPreview());
    const alreadyRendered = $visualizationPreview.has('.bar-chart').length === 1;

    if (alreadyRendered) {
      this.updateVisualization();
    } else {
      this.destroyVisualizationPreview();

      $visualizationPreview.
        socrataSvgBarChart(vif);
    }
  },

  columnChart() {
    const { vif } = this.props;
    const $visualizationPreview = $(this.visualizationPreview());
    const alreadyRendered = $visualizationPreview.has('.column-chart').length === 1;

    if (alreadyRendered) {
      this.updateVisualization();
    } else {
      this.destroyVisualizationPreview();

      $visualizationPreview.
        socrataSvgColumnChart(vif);
    }
  },

  pieChart() {
    var { vif } = this.props;
    var $visualizationPreview = $(this.visualizationPreview());
    var alreadyRendered = $visualizationPreview.has('.pie-chart').length === 1;

    if (alreadyRendered) {
      this.updateVisualization();
    } else {
      this.destroyVisualizationPreview();

      $visualizationPreview.
      socrataSvgPieChart(vif);
    }
  },

  histogram() {
    const { vif } = this.props;
    const $visualizationPreview = $(this.visualizationPreview());
    const alreadyRendered = $visualizationPreview.has('.histogram').length === 1;

    if (alreadyRendered) {
      this.updateVisualization();
    } else {
      this.destroyVisualizationPreview();

      $visualizationPreview.
        socrataSvgHistogram(vif);
    }
  },

  regionMap() {
    const { vif } = this.props;
    const $visualizationPreview = $(this.visualizationPreview());
    const alreadyRendered = $visualizationPreview.has('.region-map').length === 1;

    if (alreadyRendered) {
      this.updateVisualization();
    } else {
      this.destroyVisualizationPreview();

      $visualizationPreview.
        socrataSvgRegionMap(vif);
      $visualizationPreview.
        on('SOCRATA_VISUALIZATION_MAP_CENTER_AND_ZOOM_CHANGED', this.onCenterAndZoomChanged);
    }
  },

  featureMap() {
    const { vif } = this.props;
    const $visualizationPreview = $(this.visualizationPreview());
    const alreadyRendered = $visualizationPreview.find('.feature-map').children().length > 0;

    if (alreadyRendered) {
      this.updateVisualization();
    } else {
      this.destroyVisualizationPreview();

      $visualizationPreview.
        socrataSvgFeatureMap(vif);
      $visualizationPreview.
        on('SOCRATA_VISUALIZATION_MAP_CENTER_AND_ZOOM_CHANGED', this.onCenterAndZoomChanged);
    }
  },

  timelineChart() {
    const { vif } = this.props;
    const $visualizationPreview = $(this.visualizationPreview());
    const alreadyRendered = $visualizationPreview.has('.timeline-chart').length === 1;

    if (alreadyRendered) {
      this.updateVisualization();
    } else {
      this.destroyVisualizationPreview();

      $visualizationPreview.
        socrataSvgTimelineChart(vif);
    }
  },

  renderVisualization() {
    const { vifAuthoring } = this.props;
    const hasType = hasVisualizationType(vifAuthoring);
    const hasDimension = !_.isNull(
      _.get(
        getDimension(vifAuthoring),
        'columnName',
        null
      )
    );

    if (hasType && hasDimension) {
      this.setState({hasRenderedVisualization: true});

      if (isBarChart(vifAuthoring) && isValidBarChartVif(vifAuthoring)) {
        this.barChart();
      } else if (isColumnChart(vifAuthoring) && isValidColumnChartVif(vifAuthoring)) {
        this.columnChart();
      } else if (isTimelineChart(vifAuthoring) && isValidTimelineChartVif(vifAuthoring)) {
        this.timelineChart();
      } else if (isPieChart(vifAuthoring) && isValidPieChartVif(vifAuthoring)) {
        this.pieChart();
      } else if (isFeatureMap(vifAuthoring) && isValidFeatureMapVif(vifAuthoring)) {
        this.featureMap();
      } else if (isRegionMap(vifAuthoring) && isValidRegionMapVif(vifAuthoring)) {
        this.regionMap();
      } else if (isHistogram(vifAuthoring) && isValidHistogramVif(vifAuthoring)) {
        this.histogram();
      } else {
        while (this.preview.firstChild) {
          this.preview.removeChild(this.preview.firstChild);
        }
      }
    }
  },

  renderMapInfo() {
    const { vifAuthoring } = this.props;
    const { hasPannedOrZoomed } = vifAuthoring.authoring;

    if (!hasPannedOrZoomed && isRenderableMap(vifAuthoring)) {
      return (
        <div className="visualization-preview-map-message alert info">
          <span className="visualization-preview-map-icon icon-info" />
          <small className="visualization-preview-map-text">{translate('preview.center_and_zoom')}</small>
        </div>
      );
    }
  },

  renderMapSaving() {
    const { vifAuthoring } = this.props;
    const { showCenteringAndZoomingSaveMessage } = vifAuthoring.authoring;

    if (showCenteringAndZoomingSaveMessage && isRenderableMap(vifAuthoring)) {
      return (
        <div className="visualization-preview-map-saving alert success">
          <span className="visualization-preview-map-saving-icon icon-checkmark3" />
          <small className="visualization-preview-map-saving-text">{translate('preview.saving_center_and_zoom')}</small>
        </div>
      );
    }
  },

  renderGetStartedMessage() {
    const { vifAuthoring } = this.props;
    const hasType = hasVisualizationType(vifAuthoring);
    const hasDimension = !_.isNull(
      _.get(
        getDimension(vifAuthoring),
        'columnName',
        null
      )
    );

    if (hasType && hasDimension) {
      return null;
    } else {

      return (
        <div className="get-started-container">
          <h5 className="get-started-title">{translate('preview.get_started.title')}</h5>
          <p className="get-started-description">{translate('preview.get_started.description')}</p>
        </div>
      );
    }
  },

  render() {
    const { vifAuthoring } = this.props;
    const previewClasses = classNames(
      'visualization-preview',
      {
        'visualization-preview-rendered': isInsertableVisualization(vifAuthoring)
      }
    );

    return (
      <div className="visualization-preview-container">
        <div className={previewClasses} ref={(ref) => this.preview = ref}>
          {this.renderGetStartedMessage()}
        </div>
        <div className="visualization-preview-map-info-container">
          {this.renderMapSaving()}
          {this.renderMapInfo()}
        </div>
      </div>
    );
  }
});

function mapStateToProps(state) {
  return {
    hasRenderedVisualization: state.hasRenderedVisualization,
    vifAuthoring: state.vifAuthoring,
    vif: getCurrentVif(state.vifAuthoring)
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onCenterAndZoomChanged(centerAndZoom) {
      dispatch(requestCenterAndZoom(centerAndZoom));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Visualization);
