import $ from 'jquery';
import _ from 'lodash';
import classNames from 'classnames';
import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';

import Visualization from '../../components/Visualization';

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

export var VisualizationPreview = React.createClass({
  propTypes: {
    vif: React.PropTypes.object,
    vifAuthoring: React.PropTypes.object
  },

  componentDidMount() {
    $(this.visualizationPreview()).
      on('SOCRATA_VISUALIZATION_MAP_CENTER_AND_ZOOM_CHANGED', this.onCenterAndZoomChanged);
  },

  componentWillUnMount() {
    $(this.visualizationPreview()).
      off('SOCRATA_VISUALIZATION_MAP_CENTER_AND_ZOOM_CHANGED', this.onCenterAndZoomChanged);
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
    const hasDimension = !_.isNull(
      _.get(
        getDimension(vifAuthoring),
        'columnName',
        null
      )
    );

    if (hasType && hasDimension && this.isVifValid()) {
      return <Visualization vif={vif} />;
    }

    return null;
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
          {this.renderVisualization()}
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

export default connect(mapStateToProps, mapDispatchToProps)(VisualizationPreview);
