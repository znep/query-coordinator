import _ from 'lodash';
import React from 'react';
import Styleguide from 'socrata-components';
import { connect } from 'react-redux';

import { translate } from '../../../I18n';
import {
  BASE_LAYERS,
  COLOR_SCALES,
  COLORS,
  INPUT_DEBOUNCE_MILLISECONDS
} from '../../constants';

import CustomizationTabPane from '../CustomizationTabPane';
import EmptyPane from './EmptyPane';

import {
  getPrimaryColor,
  getSecondaryColor,
  getPointOpacity,
  getColorScale,
  getBaseLayer,
  getBaseLayerOpacity,
  isRegionMap,
  isColumnChart,
  isFeatureMap,
  isHistogram,
  isTimelineChart
} from '../../selectors/vifAuthoring';

import {
  setPrimaryColor,
  setSecondaryColor,
  setPointOpacity,
  setColorScale,
  setBaseLayer,
  setBaseLayerOpacity
} from '../../actions';

export var ColorsAndStylePane = React.createClass({
  getDefaultProps() {
    return {
      baseLayers: BASE_LAYERS,
      colorScales: COLOR_SCALES
    };
  },

  onSelectColorScale(event) {
    var colorScale = _.find(this.props.colorScales, {value: event.target.value}).scale;
    this.props.onSelectColorScale(colorScale);
  },

  renderPrimaryColor(labelText) {
    var primaryColor = getPrimaryColor(this.props.vifAuthoring);

    return (
      <div>
        <label className="block-label" htmlFor="primary-color">{labelText}</label>
        <Styleguide.ColorPicker handleColorChange={this.props.onChangePrimaryColor} value={primaryColor} palette={COLORS}/>
      </div>
    );
  },

  renderSecondaryColor(labelText) {
    var secondaryColor = getSecondaryColor(this.props.vifAuthoring);

    return (
      <div>
        <label className="block-label" htmlFor="secondary-color">{labelText}</label>
        <Styleguide.ColorPicker handleColorChange={this.props.onChangeSecondaryColor} value={secondaryColor} palette={COLORS}/>
      </div>
    );
  },

  renderColumnChartControls() {
    return this.renderPrimaryColor(translate('panes.colors_and_style.fields.bar_color.title'));
  },

  renderHistogramControls() {
    return this.renderPrimaryColor(translate('panes.colors_and_style.fields.bar_color.title'));
  },

  renderTimelineChartControls() {
    return (
      <div>
        {this.renderPrimaryColor(translate('panes.colors_and_style.fields.line_color.title'))}
        {this.renderSecondaryColor(translate('panes.colors_and_style.fields.area_color.title'))}
      </div>
    );
  },

  renderFeatureMapControls() {
    var { vifAuthoring, onChangePrimaryColor, onChangePointOpacity } = this.props;
    var pointColor = getPrimaryColor(vifAuthoring);
    var pointOpacity = getPointOpacity(vifAuthoring);

    var pointColorAttributes = {
      handleColorChange: onChangePrimaryColor,
      value: pointColor,
      palette: COLORS
    };

    var pointOpacityAttributes = {
      id: 'point-opacity',
      type: 'range',
      min: '0',
      max: '1',
      step: '0.1',
      defaultValue: pointOpacity / 100,
      onChange: onChangePointOpacity
    };

    return (
      <div>
        <div className="authoring-field-group">
          <h5>{translate('panes.colors_and_style.subheaders.points')}</h5>
          <div className="authoring-field">
            <label className="block-label" htmlFor="point-color">{translate('panes.colors_and_style.fields.point_color.title')}</label>
            <Styleguide.ColorPicker {...pointColorAttributes} />
          </div>
          <div className="authoring-field">
            <label className="block-label" htmlFor="point-opacity">{translate('panes.colors_and_style.fields.point_opacity.title')}</label>
            <input {...pointOpacityAttributes} />
          </div>
          {this.renderMapLayerControls()}
        </div>
      </div>
    );
  },

  renderRegionMapControls() {
    var { vifAuthoring, colorScales, onSelectColorScale } = this.props;
    var defaultColorScale = getColorScale(vifAuthoring);

    var defaultColorScaleKey = _.find(colorScales, colorScale => {
      var negativeColorsMatch = defaultColorScale.negativeColor === colorScale.scale[0];
      var zeroColorsMatch = defaultColorScale.zeroColor === colorScale.scale[1];
      var positiveColorsMatch = defaultColorScale.positiveColor === colorScale.scale[2];

      return negativeColorsMatch && zeroColorsMatch && positiveColorsMatch;
    }).value;

    var colorScaleAttributes = {
      id: 'color-scale',
      options: colorScales,
      value: defaultColorScaleKey,
      onSelection: onSelectColorScale
    };

    return (
      <div>
        <label className="block-label" htmlFor="color-scale">{translate('panes.colors_and_style.fields.color_scale.title')}</label>
        <div className="color-scale-dropdown-container">
          <Styleguide.Dropdown {...colorScaleAttributes} />
        </div>
        {this.renderMapLayerControls()}
      </div>
    );
  },

  renderMapLayerControls() {
    var { vifAuthoring, baseLayers, onSelectBaseLayer, onChangeBaseLayerOpacity } = this.props;
    var defaultBaseLayer = getBaseLayer(vifAuthoring);
    var defaultBaseLayerOpacity = getBaseLayerOpacity(vifAuthoring);

    var baseLayerAttributes = {
      id: 'base-layer',
      options: _.map(baseLayers, baseLayer => ({title: baseLayer.title, value: baseLayer.value})),
      value: defaultBaseLayer,
      onSelection: onSelectBaseLayer
    };

    var baseLayerOpacityAttributes = {
      id: 'base-layer-opacity',
      type: 'range',
      min: '0',
      max: '1',
      step: '0.1',
      defaultValue: defaultBaseLayerOpacity / 100,
      onChange: onChangeBaseLayerOpacity
    };

    return (
      <div className="authoring-field-group">
        <h5>{translate('panes.colors_and_style.subheaders.map')}</h5>
        <div className="authoring-field">
          <label className="block-label" htmlFor="base-layer">{translate('panes.colors_and_style.fields.base_layer.title')}</label>
          <div className="base-layer-dropdown-container">
            <Styleguide.Dropdown {...baseLayerAttributes} />
          </div>
        </div>
        <div className="authoring-field">
          <label className="block-label" htmlFor="base-layer-opacity">{translate('panes.colors_and_style.fields.base_layer_opacity.title')}</label>
          <input {...baseLayerOpacityAttributes}/>
        </div>
      </div>
    );
  },

  renderEmptyPane() {
    return <EmptyPane />;
  },

  render() {
    var configuration;
    var vifAuthoring = this.props.vifAuthoring;

    if (isColumnChart(vifAuthoring)) {
      configuration = this.renderColumnChartControls();
    } else if (isHistogram(vifAuthoring)) {
      configuration = this.renderHistogramControls();
    } else if (isTimelineChart(vifAuthoring)) {
      configuration = this.renderTimelineChartControls();
    } else if (isFeatureMap(vifAuthoring)) {
      configuration = this.renderFeatureMapControls();
    } else if (isRegionMap(vifAuthoring)) {
      configuration = this.renderRegionMapControls();
    } else {
      configuration = this.renderEmptyPane();
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
    onChangePrimaryColor: _.debounce(primaryColor => {
      dispatch(setPrimaryColor(primaryColor));
    }, INPUT_DEBOUNCE_MILLISECONDS),

    onChangeSecondaryColor: _.debounce(secondaryColor => {
      dispatch(setSecondaryColor(secondaryColor));
    }, INPUT_DEBOUNCE_MILLISECONDS),

    onSelectBaseLayer: baseLayer => {
      dispatch(setBaseLayer(baseLayer.value));
    },

    onChangeBaseLayerOpacity: _.debounce(event => {
      var baseLayerOpacity = event.target.value;
      dispatch(setBaseLayerOpacity(baseLayerOpacity));
    }, INPUT_DEBOUNCE_MILLISECONDS),

    onChangePointOpacity: _.debounce(event => {
      var pointOpacity = event.target.value;
      dispatch(setPointOpacity(pointOpacity));
    }, INPUT_DEBOUNCE_MILLISECONDS),

    onSelectColorScale: colorScale => {
      dispatch(setColorScale(...colorScale.scale));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ColorsAndStylePane);
