import React from 'react';
import Styleguide from 'socrata-styleguide';
import { connect } from 'react-redux';

import { INPUT_DEBOUNCE_MILLISECONDS, BASE_LAYERS, COLOR_SCALES } from '../constants';
import CustomizationTabPane from '../CustomizationTabPane';

import {
  getBaseColor,
  getPointColor,
  getPointOpacity,
  getColorScale,
  getBaseLayer,
  getBaseLayerOpacity,
  isColumnChart,
  isTimelineChart,
  isFeatureMap,
  isChoroplethMap
} from '../selectors/vifAuthoring';

import {
  setBaseColor,
  setPointColor,
  setPointOpacity,
  setColorScale,
  setBaseLayer,
  setBaseLayerOpacity
} from '../actions';

export var ColorsAndStylePane = React.createClass({
  getDefaultProps() {
    return {
      baseLayers: BASE_LAYERS,
      colorScales: COLOR_SCALES
    };
  },

  onChangeColorScale(event) {
    var colorScale = _.find(this.props.colorScales, {value: event.target.value}).scale;
    this.props.onChangeColorScale(colorScale);
  },

  baseColor() {
    var baseColor = getBaseColor(this.props.vifAuthoring);

    return (
      <div>
        <label className="block-label" htmlFor="base-color">Base Color:</label>
        <Styleguide.components.ColorPicker handleColorChange={this.props.onChangeBaseColor} value={baseColor} />
      </div>
    );
  },

  columnChart() {
    return this.baseColor();
  },

  timelineChart() {
    return this.baseColor();
  },

  featureMap() {
    var pointColor = getPointColor(this.props.vifAuthoring);
    var pointOpacity = getPointOpacity(this.props.vifAuthoring);

    return (
      <div>
        <label className="block-label" htmlFor="point-color">Point Color:</label>
        <Styleguide.components.ColorPicker handleColorChange={this.props.onChangePointColor} value={pointColor} />
        <label className="block-label" htmlFor="point-opacity">Point Opacity:</label>
        <input id="point-opacity" type="range" min="0" max="1" step="0.1" defaultValue={pointOpacity} onChange={this.props.onChangePointOpacity} />
        {this.mapLayerControls()}
      </div>
    );
  },

  choroplethMap() {
    var defaultColorScale = getColorScale(this.props.vifAuthoring);
    var defaultColorScaleKey = _.find(this.props.colorScales, colorScale => {
      var negativeColorsMatch = defaultColorScale.negativeColor === colorScale.scale[0];
      var zeroColorsMatch = defaultColorScale.zeroColor === colorScale.scale[1];
      var positiveColorsMatch = defaultColorScale.positiveColor === colorScale.scale[2];

      return negativeColorsMatch && zeroColorsMatch && positiveColorsMatch;
    }).value;

    var colorScaleOptions = _.map(this.props.colorScales, colorScale => {
      return <option key={colorScale.value} value={colorScale.value}>{colorScale.title}</option>
    });

    return (
      <div>
        <label className="block-label" htmlFor="color-scale">Color Scale:</label>
        <div className="color-scale-dropdown-container">
          <select id="color-scale" onChange={this.onChangeColorScale} defaultValue={defaultColorScaleKey}>
            {colorScaleOptions}
          </select>
        </div>
        {this.mapLayerControls()}
      </div>
    );
  },

  mapLayerControls() {
    var defaultBaseLayer = getBaseLayer(this.props.vifAuthoring);
    var defaultBaseLayerOpacity = getBaseLayerOpacity(this.props.vifAuthoring);

    var baseLayerOptions = _.map(this.props.baseLayers, baseLayer => {
      return <option key={baseLayer.value} value={baseLayer.value}>{baseLayer.title}</option>;
    });

    var baseLayerOpacityAttributes = {
      id: 'base-layer-opacity',
      type: 'range',
      min: '0',
      max: '1',
      step: '0.1',
      defaultValue: defaultBaseLayerOpacity,
      onChange: this.props.onChangeBaseLayerOpacity
    };

    return (
      <div>
        <label className="block-label" htmlFor="base-layer">Map Type:</label>
        <div className="base-layer-dropdown-container">
          <select id="base-layer" onChange={this.props.onChangeBaseLayer} defaultValue={defaultBaseLayer}>
            {baseLayerOptions}
          </select>
        </div>
        <label className="block-label" htmlFor="base-layer-opacity">Map Layer Opacity:</label>
        <input {...baseLayerOpacityAttributes}/>
      </div>
    );
  },

  render() {
    var configuration;
    var vifAuthoring = this.props.vifAuthoring;

    if (isColumnChart(vifAuthoring)) {
      configuration = this.columnChart();
    } else if (isTimelineChart(vifAuthoring)) {
      configuration = this.timelineChart();
    } else if (isFeatureMap(vifAuthoring)) {
      configuration = this.featureMap();
    } else if (isChoroplethMap(vifAuthoring)) {
      configuration = this.choroplethMap();
    }

    return (
      <form>
        {configuration}
      </form>
    );
  }
});

function mapStateToProps(state) {
  return {
    vifAuthoring: state.vifAuthoring
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onChangeBaseColor: _.debounce(baseColor => {
      dispatch(setBaseColor(baseColor));
    }, INPUT_DEBOUNCE_MILLISECONDS),

    onChangeBaseLayer: event => {
      var baseLayer = event.target.value;
      dispatch(setBaseLayer(baseLayer));
    },

    onChangeBaseLayerOpacity: _.debounce(event => {
      var baseLayerOpacity = event.target.value;
      dispatch(setBaseLayerOpacity(baseLayerOpacity));
    }, INPUT_DEBOUNCE_MILLISECONDS),

    onChangePointColor: _.debounce(pointColor => {
      dispatch(setPointColor(pointColor));
    }, INPUT_DEBOUNCE_MILLISECONDS),

    onChangePointOpacity: _.debounce(event => {
      var pointOpacity = event.target.value;
      dispatch(setPointOpacity(pointOpacity));
    }, INPUT_DEBOUNCE_MILLISECONDS),

    onChangeColorScale: colorScale => {
      dispatch(setColorScale(...colorScale));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ColorsAndStylePane);
