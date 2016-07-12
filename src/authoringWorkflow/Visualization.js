import $ from 'jquery';
import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';

import { translate } from './I18n';
import { setCenterAndZoom } from './actions';
import RowInspector from '../views/RowInspector';
import FlyoutRenderer from '../views/FlyoutRenderer';

import {
  getVisualizationType,
  hasVisualizationType,
  isTimelineChart,
  isValidTimelineChartVif,
  isFeatureMap,
  isValidFeatureMapVif,
  isColumnChart,
  isValidColumnChartVif,
  isChoroplethMap,
  isValidChoroplethMapVif,
  getCurrentVif
} from './selectors/vifAuthoring';

export var Visualization = React.createClass({
  propTypes: {
    vif: React.PropTypes.object,
    vifAuthoring: React.PropTypes.object
  },

  getInitialState() {
    return {
      flyoutRenderer: null
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
    return !_.isEqual(this.props.vif, nextProps.vif);
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

  columnChart() {
    var { vif } = this.props;
    var onFlyout = event => this.onFlyout(event);
    var $visualizationPreview = $(this.visualizationPreview());
    var alreadyRendered = $visualizationPreview.has('.column-chart').length === 1;

    if (alreadyRendered) {
      this.updateVisualization();
    } else {
      $visualizationPreview.
        trigger('SOCRATA_VISUALIZATION_DESTROY').
        socrataSvgColumnChart(vif);
      $visualizationPreview.
        on('SOCRATA_VISUALIZATION_FLYOUT', onFlyout);
    }
  },

  choroplethMap() {
    var { vif } = this.props;
    var onFlyout = event => this.onFlyout(event);
    var onCenterAndZoomChanged = event => this.onCenterAndZoomChanged(event);
    var $visualizationPreview = $(this.visualizationPreview());
    var alreadyRendered = $visualizationPreview.has('.choropleth-map-container').length === 1;

    if (alreadyRendered) {
      this.updateVisualization();
    } else {
      $visualizationPreview.
        trigger('SOCRATA_VISUALIZATION_DESTROY').
        socrataChoroplethMap(vif);
      $visualizationPreview.
        on('SOCRATA_VISUALIZATION_CHOROPLETH_MAP_FLYOUT', onFlyout).
        on('SOCRATA_VISUALIZATION_MAP_CENTER_AND_ZOOM_CHANGED', onCenterAndZoomChanged);
    }
  },

  featureMap() {
    var { vif } = this.props;
    var onFlyout = event => this.onFlyout(event);
    var onCenterAndZoomChanged = event => this.onCenterAndZoomChanged(event);
    var $visualizationPreview = $(this.visualizationPreview());
    var alreadyRendered = $visualizationPreview.has('.feature-map').length === 1;

    if (alreadyRendered) {
      this.updateVisualization();
    } else {
      $visualizationPreview.
        trigger('SOCRATA_VISUALIZATION_DESTROY').
        socrataFeatureMap(vif);
      $visualizationPreview.
        on('SOCRATA_VISUALIZATION_FEATURE_MAP_FLYOUT', onFlyout).
        on('SOCRATA_VISUALIZATION_MAP_CENTER_AND_ZOOM_CHANGED', onCenterAndZoomChanged);
    }
  },

  timelineChart() {
    var { vif } = this.props;
    var onFlyout = event => this.onFlyout(event);
    var $visualizationPreview = $(this.visualizationPreview());
    var alreadyRendered = $visualizationPreview.has('.timeline-chart').length === 1;

    if (alreadyRendered) {
      this.updateVisualization();
    } else {
      $visualizationPreview.
        trigger('SOCRATA_VISUALIZATION_DESTROY').
        socrataSvgTimelineChart(vif);
      $visualizationPreview.
        on('SOCRATA_VISUALIZATION_FLYOUT', onFlyout);
    }
  },

  renderVisualization() {
    var { vif, vifAuthoring } = this.props;

    if (hasVisualizationType(vifAuthoring)) {
      if (isColumnChart(vifAuthoring) && isValidColumnChartVif(vifAuthoring)) {
        this.columnChart();
      } else if (isTimelineChart(vifAuthoring) && isValidTimelineChartVif(vifAuthoring)) {
        this.timelineChart();
      } else if (isFeatureMap(vifAuthoring) && isValidFeatureMapVif(vifAuthoring)) {
        this.featureMap();
      } else if (isChoroplethMap(vifAuthoring) && isValidChoroplethMapVif(vifAuthoring)) {
        this.choroplethMap();
      }
    }
  },

  render() {
    return (
      <div className="visualization-preview-container">
        <div className="visualization-toggler">
          <small>{translate('preview.tabs.visualization')}</small>
        </div>
        <div className="visualization-preview"></div>
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
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Visualization);
