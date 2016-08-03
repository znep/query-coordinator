import $ from 'jquery';
import _ from 'lodash';
import classNames from 'classnames';
import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';

import RowInspector from '../../views/RowInspector';
import FlyoutRenderer from '../../views/FlyoutRenderer';

import '../../views/SvgHistogram';
import '../../views/SvgColumnChart';
import '../../views/SvgTimelineChart';
import '../../views/SvgFeatureMap';
import '../../views/SvgRegionMap';

import { translate } from '../../I18n';
import { requestCenterAndZoom } from '../actions';
import {
  hasVisualizationType,
  isInsertableVisualization,
  isTimelineChart,
  isValidTimelineChartVif,
  isFeatureMap,
  isValidFeatureMapVif,
  isColumnChart,
  isValidColumnChartVif,
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
      flyoutRenderer: null,
      hasRenderedVisualization: false
    };
  },

  componentDidMount() {
    this.setState({
      flyoutRenderer: new FlyoutRenderer()
    });

    RowInspector.setup();
    this.renderVisualization();
  },

  componentDidUpdate() {
    this.renderVisualization();
  },

  shouldComponentUpdate(nextProps) {
    var { vif, vifAuthoring } = this.props;
    var { showCenteringAndZoomingSaveMessage } = nextProps.vifAuthoring.authoring;
    var vifChanged = !_.isEqual(vif, nextProps.vif);

    return vifChanged || vifAuthoring.authoring.showCenteringAndZoomingSaveMessage !== showCenteringAndZoomingSaveMessage;
  },

  onFlyout(event) {
    var payload = event.originalEvent.detail;

    // Render/hide a flyout
    if (payload !== null) {
      this.state.flyoutRenderer.render(payload);
    } else {
      this.state.flyoutRenderer.clear();
    }
  },

  onCenterAndZoomChanged(event) {
    var centerAndZoom = _.get(event, 'originalEvent.detail');
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
      off('SOCRATA_VISUALIZATION_FLYOUT', this.onFlyout).
      off('SOCRATA_VISUALIZATION_MAP_CENTER_AND_ZOOM_CHANGED', this.onCenterAndZoomChanged);
  },

  columnChart() {
    var { vif } = this.props;
    var $visualizationPreview = $(this.visualizationPreview());
    var alreadyRendered = $visualizationPreview.has('.column-chart').length === 1;

    if (alreadyRendered) {
      this.updateVisualization();
    } else {
      this.destroyVisualizationPreview();

      $visualizationPreview.
        socrataSvgColumnChart(vif);
      $visualizationPreview.
        on('SOCRATA_VISUALIZATION_FLYOUT', this.onFlyout);
    }
  },

  histogram() {
    var { vif } = this.props;
    var $visualizationPreview = $(this.visualizationPreview());
    var alreadyRendered = $visualizationPreview.has('.histogram').length === 1;

    if (alreadyRendered) {
      this.updateVisualization();
    } else {
      this.destroyVisualizationPreview();

      $visualizationPreview.
        socrataSvgHistogram(vif);
      $visualizationPreview.
        on('SOCRATA_VISUALIZATION_FLYOUT', this.onFlyout);
    }
  },

  regionMap() {
    var { vif } = this.props;
    var $visualizationPreview = $(this.visualizationPreview());
    var alreadyRendered = $visualizationPreview.has('.region-map').length === 1;

    if (alreadyRendered) {
      this.updateVisualization();
    } else {
      this.destroyVisualizationPreview();

      $visualizationPreview.
        socrataSvgRegionMap(vif);
      $visualizationPreview.
        on('SOCRATA_VISUALIZATION_FLYOUT', this.onFlyout).
        on('SOCRATA_VISUALIZATION_MAP_CENTER_AND_ZOOM_CHANGED', this.onCenterAndZoomChanged);
    }
  },

  featureMap() {
    var { vif } = this.props;
    var $visualizationPreview = $(this.visualizationPreview());
    var alreadyRendered = $visualizationPreview.find('.feature-map').children().length > 0;

    if (alreadyRendered) {
      this.updateVisualization();
    } else {
      this.destroyVisualizationPreview();

      $visualizationPreview.
        socrataSvgFeatureMap(vif);
      $visualizationPreview.
        on('SOCRATA_VISUALIZATION_FLYOUT', this.onFlyout).
        on('SOCRATA_VISUALIZATION_MAP_CENTER_AND_ZOOM_CHANGED', this.onCenterAndZoomChanged);
    }
  },

  timelineChart() {
    var { vif } = this.props;
    var $visualizationPreview = $(this.visualizationPreview());
    var alreadyRendered = $visualizationPreview.has('.timeline-chart').length === 1;

    if (alreadyRendered) {
      this.updateVisualization();
    } else {
      this.destroyVisualizationPreview();

      $visualizationPreview.
        socrataSvgTimelineChart(vif);
      $visualizationPreview.
        on('SOCRATA_VISUALIZATION_FLYOUT', this.onFlyout);
    }
  },

  renderVisualization() {
    var { vifAuthoring } = this.props;

    if (hasVisualizationType(vifAuthoring)) {
      this.setState({hasRenderedVisualization: true});

      if (isColumnChart(vifAuthoring) && isValidColumnChartVif(vifAuthoring)) {
        this.columnChart();
      } else if (isTimelineChart(vifAuthoring) && isValidTimelineChartVif(vifAuthoring)) {
        this.timelineChart();
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
    var { vifAuthoring } = this.props;
    var { hasPannedOrZoomed } = vifAuthoring.authoring;

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
    var { vifAuthoring } = this.props;
    var { showCenteringAndZoomingSaveMessage } = vifAuthoring.authoring;

    if (showCenteringAndZoomingSaveMessage && isRenderableMap(vifAuthoring)) {
      return (
        <div className="visualization-preview-map-saving alert success">
          <span className="visualization-preview-map-saving-icon icon-checkmark3" />
          <small className="visualization-preview-map-saving-text">{translate('preview.saving_center_and_zoom')}</small>
        </div>
      );
    }
  },

  render() {
    var { vifAuthoring } = this.props;
    var previewClasses = classNames('visualization-preview', {
      'visualization-preview-rendered': isInsertableVisualization(vifAuthoring)
    });

    return (
      <div className="visualization-preview-container">
        <div className="visualization-toggler">
          <small>{translate('preview.tabs.visualization')}</small>
        </div>
        <div className={previewClasses} ref={(ref) => this.preview = ref}/>
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