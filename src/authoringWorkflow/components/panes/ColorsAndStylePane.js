import _ from 'lodash';
import React from 'react';
import Styleguide from 'socrata-components';
import { connect } from 'react-redux';

import { translate } from '../../../I18n';
import { onDebouncedEvent } from '../../helpers';

import {
  BASE_LAYERS,
  COLOR_SCALES,
  COLOR_PALETTES,
  COLORS,
  MAP_SLIDER_DEBOUNCE_MILLISECONDS
} from '../../constants';

import EmptyPane from './EmptyPane';
import Accordion from '../shared/Accordion';
import AccordionPane from '../shared/AccordionPane';
import DebouncedSlider from '../shared/DebouncedSlider';

import {
  getPrimaryColor,
  getSecondaryColor,
  getPointOpacity,
  getPointSize,
  getColorScale,
  getColorPalette,
  getBaseLayer,
  getBaseLayerOpacity,
  isBarChart,
  isGroupedBarChart,
  isRegionMap,
  isColumnChart,
  isGroupedColumnChart,
  isFeatureMap,
  isHistogram,
  isTimelineChart,
  isGroupedTimelineChart,
  isPieChart
} from '../../selectors/vifAuthoring';

import {
  setPrimaryColor,
  setSecondaryColor,
  setPointOpacity,
  setPointSize,
  setColorScale,
  setColorPalette,
  setBaseLayer,
  setBaseLayerOpacity
} from '../../actions';

export var ColorsAndStylePane = React.createClass({
  getDefaultProps() {
    return {
      baseLayers: BASE_LAYERS,
      colorScales: COLOR_SCALES,
      colorPalettes: COLOR_PALETTES
    };
  },

  onSelectColorScale(event) {
    var colorScale = _.find(this.props.colorScales, { value: event.target.value }).scale;
    this.props.onSelectColorScale(colorScale);
  },

  renderPrimaryColor(labelText) {
    var { vifAuthoring, onChangePrimaryColor } = this.props;
    var primaryColor = getPrimaryColor(vifAuthoring);
    var handleColorChange = onDebouncedEvent(this, onChangePrimaryColor, (color) => color);

    return (
      <div>
        <label className="block-label" htmlFor="primary-color">{labelText}</label>
        <Styleguide.ColorPicker handleColorChange={handleColorChange} value={primaryColor} palette={COLORS}/>
      </div>
    );
  },

  renderSecondaryColor(labelText) {
    var { vifAuthoring, onChangeSecondaryColor } = this.props;
    var secondaryColor = getSecondaryColor(vifAuthoring);
    var handleColorChange = onDebouncedEvent(this, onChangeSecondaryColor, (color) => color);

    return (
      <div>
        <label className="block-label" htmlFor="secondary-color">{labelText}</label>
        <Styleguide.ColorPicker handleColorChange={handleColorChange} value={secondaryColor} palette={COLORS}/>
      </div>
    );
  },

  renderGroupedBarChartControls() {
    const { vifAuthoring, colorPalettes, onSelectColorPalette } = this.props;
    const selectedColorPalette = getColorPalette(vifAuthoring);
    const colorPaletteAttributes = {
      id: 'color-palette',
      options: colorPalettes,
      value: selectedColorPalette,
      onSelection: onDebouncedEvent(this, onSelectColorPalette, (event) => event.value)
    };

    return (
      <AccordionPane title={translate('panes.colors_and_style.subheaders.colors')}>
        <label className="block-label"
               htmlFor="color-palette">{translate('panes.colors_and_style.fields.color_palette.title')}</label>
        <div className="color-scale-dropdown-container">
          <Styleguide.Dropdown {...colorPaletteAttributes} />
        </div>
      </AccordionPane>
    );
  },

  renderBarChartControls() {
    return (
      <AccordionPane title={translate('panes.colors_and_style.subheaders.colors')}>
        {this.renderPrimaryColor(translate('panes.colors_and_style.fields.bar_color.title'))}
      </AccordionPane>
    );
  },

  renderGroupedColumnChartControls() {
    const { vifAuthoring, colorPalettes, onSelectColorPalette } = this.props;
    const selectedColorPalette = getColorPalette(vifAuthoring);
    const colorPaletteAttributes = {
      id: 'color-palette',
      options: colorPalettes,
      value: selectedColorPalette,
      onSelection: onDebouncedEvent(this, onSelectColorPalette, (event) => event.value)
    };

    return (
      <AccordionPane title={translate('panes.colors_and_style.subheaders.colors')}>
        <label className="block-label"
               htmlFor="color-palette">{translate('panes.colors_and_style.fields.color_palette.title')}</label>
        <div className="color-scale-dropdown-container">
          <Styleguide.Dropdown {...colorPaletteAttributes} />
        </div>
      </AccordionPane>
    );
  },

  renderColumnChartControls() {
    return (
      <AccordionPane title={translate('panes.colors_and_style.subheaders.colors')}>
        {this.renderPrimaryColor(translate('panes.colors_and_style.fields.bar_color.title'))}
      </AccordionPane>
    );
  },

  renderHistogramControls() {
    return (
      <AccordionPane title={translate('panes.colors_and_style.subheaders.colors')}>
        {this.renderPrimaryColor(translate('panes.colors_and_style.fields.bar_color.title'))}
      </AccordionPane>
    );
  },

  renderTimelineChartControls() {
    return (
      <AccordionPane title={translate('panes.colors_and_style.subheaders.colors')}>
        {this.renderPrimaryColor(translate('panes.colors_and_style.fields.line_color.title'))}
        {this.renderSecondaryColor(translate('panes.colors_and_style.fields.area_color.title'))}
      </AccordionPane>
    );
  },

  renderGroupedTimelineChartControls() {
    const { vifAuthoring, colorPalettes, onSelectColorPalette } = this.props;
    const selectedColorPalette = getColorPalette(vifAuthoring);
    const colorPaletteAttributes = {
      id: 'color-palette',
      options: colorPalettes,
      value: selectedColorPalette,
      onSelection: onDebouncedEvent(this, onSelectColorPalette, (event) => event.value)
    };

    return (
      <AccordionPane title={translate('panes.colors_and_style.subheaders.colors')}>
        <label className="block-label"
               htmlFor="color-palette">{translate('panes.colors_and_style.fields.color_palette.title')}</label>
        <div className="color-scale-dropdown-container">
          <Styleguide.Dropdown {...colorPaletteAttributes} />
        </div>
      </AccordionPane>
    );
  },

  renderFeatureMapControls() {
    var { vifAuthoring, onChangePrimaryColor, onChangePointOpacity, onChangePointSize } = this.props;
    var pointColor = getPrimaryColor(vifAuthoring);
    var pointOpacity = getPointOpacity(vifAuthoring);
    var pointSize = getPointSize(vifAuthoring);

    var pointColorAttributes = {
      handleColorChange: onChangePrimaryColor,
      value: pointColor,
      palette: COLORS
    };

    var pointOpacityAttributes = {
      id: 'point-opacity',
      rangeMin: 0,
      rangeMax: 1,
      step: 0.1,
      value: pointOpacity / 100,
      onChange: onChangePointOpacity,
      delay: MAP_SLIDER_DEBOUNCE_MILLISECONDS
    };

    const pointSizeAttributes = {
      id: 'point-size',
      rangeMin: 1,
      rangeMax: 3.2,
      step: 0.1,
      value: pointSize,
      onChange: onChangePointSize,
      delay: MAP_SLIDER_DEBOUNCE_MILLISECONDS
    };

    const pointControls = (
      <AccordionPane key="pointControls" title={translate('panes.colors_and_style.subheaders.points')}>
        <div className="authoring-field">
          <label className="block-label"
                 htmlFor="point-color">{translate('panes.colors_and_style.fields.point_color.title')}</label>
          <Styleguide.ColorPicker {...pointColorAttributes} />
        </div>
        <div className="authoring-field">
          <label className="block-label"
                 htmlFor="point-opacity">{translate('panes.colors_and_style.fields.point_opacity.title')}</label>
          <div id="point-opacity">
            <DebouncedSlider {...pointOpacityAttributes} />
          </div>
        </div>
        <div className="authoring-field">
          <label className="block-label"
                 htmlFor="point-size">{translate('panes.colors_and_style.fields.point_size.title')}</label>
          <div id="point-size">
            <DebouncedSlider {...pointSizeAttributes} />
          </div>
        </div>
      </AccordionPane>
    );

    return [pointControls, this.renderMapLayerControls()];
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

    const colorControls = (
      <AccordionPane key="colorControls" title={translate('panes.colors_and_style.subheaders.colors')}>
        <label className="block-label"
               htmlFor="color-scale">{translate('panes.colors_and_style.fields.color_scale.title')}</label>
        <div className="color-scale-dropdown-container">
          <Styleguide.Dropdown {...colorScaleAttributes} />
        </div>
      </AccordionPane>
    );

    return [colorControls, this.renderMapLayerControls()];
  },

  renderMapLayerControls() {
    var { vifAuthoring, baseLayers, onSelectBaseLayer, onChangeBaseLayerOpacity } = this.props;
    var defaultBaseLayer = getBaseLayer(vifAuthoring);
    var defaultBaseLayerOpacity = getBaseLayerOpacity(vifAuthoring);

    var baseLayerAttributes = {
      id: 'base-layer',
      options: _.map(baseLayers, baseLayer => ({ title: baseLayer.title, value: baseLayer.value })),
      value: defaultBaseLayer,
      onSelection: onSelectBaseLayer
    };

    var baseLayerOpacityAttributes = {
      id: 'base-layer-opacity',
      rangeMin: 0,
      rangeMax: 1,
      step: 0.1,
      value: defaultBaseLayerOpacity / 100,
      onChange: onChangeBaseLayerOpacity,
      delay: MAP_SLIDER_DEBOUNCE_MILLISECONDS
    };

    return (
      <AccordionPane key="mapLayerControls" title={translate('panes.colors_and_style.subheaders.map')}>
        <div className="authoring-field">
          <label className="block-label"
                 htmlFor="base-layer">{translate('panes.colors_and_style.fields.base_layer.title')}</label>
          <div className="base-layer-dropdown-container">
            <Styleguide.Dropdown {...baseLayerAttributes} />
          </div>
        </div>
        <div className="authoring-field">
          <label className="block-label"
                 htmlFor="base-layer-opacity">{translate('panes.colors_and_style.fields.base_layer_opacity.title')}</label>
          <div id="base-layer-opacity">
            <DebouncedSlider {...baseLayerOpacityAttributes} />
          </div>
        </div>
      </AccordionPane>
    );
  },

  renderPieChartControls() {
    const { vifAuthoring, colorPalettes, onSelectColorPalette } = this.props;
    const selectedColorPalette = getColorPalette(vifAuthoring);
    const colorPaletteAttributes = {
      id: 'color-palette',
      options: colorPalettes,
      value: selectedColorPalette,
      onSelection: onDebouncedEvent(this, onSelectColorPalette, (event) => event.value)
    };

    return (
      <AccordionPane title={translate('panes.colors_and_style.subheaders.colors')}>
        <label className="block-label"
               htmlFor="color-palette">{translate('panes.colors_and_style.fields.color_palette.title')}</label>
        <div className="color-scale-dropdown-container">
          <Styleguide.Dropdown {...colorPaletteAttributes} />
        </div>
      </AccordionPane>
    );
  },

  renderEmptyPane() {
    return <EmptyPane />;
  },

  render() {
    var configuration;
    var vifAuthoring = this.props.vifAuthoring;

    if (isBarChart(vifAuthoring)) {

      if (isGroupedBarChart(vifAuthoring)) {
        configuration = this.renderGroupedBarChartControls();
      } else {
        configuration = this.renderBarChartControls();
      }
    } else if (isColumnChart(vifAuthoring)) {

      if (isGroupedColumnChart(vifAuthoring)) {
        configuration = this.renderGroupedColumnChartControls();
      } else {
        configuration = this.renderColumnChartControls();
      }
    } else if (isHistogram(vifAuthoring)) {
      configuration = this.renderHistogramControls();
    } else if (isTimelineChart(vifAuthoring)) {

      if (isGroupedTimelineChart(vifAuthoring)) {
        configuration = this.renderGroupedTimelineChartControls();
      } else {
        configuration = this.renderTimelineChartControls();
      }
    } else if (isFeatureMap(vifAuthoring)) {
      configuration = this.renderFeatureMapControls();
    } else if (isRegionMap(vifAuthoring)) {
      configuration = this.renderRegionMapControls();
    } else if (isPieChart(vifAuthoring)) {
      configuration = this.renderPieChartControls();
    } else {
      configuration = this.renderEmptyPane();
    }

    return (
      <form>
        <Accordion>
          {configuration}
        </Accordion>
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
    onChangePrimaryColor: primaryColor => {
      dispatch(setPrimaryColor(primaryColor));
    },

    onChangeSecondaryColor: secondaryColor => {
      dispatch(setSecondaryColor(secondaryColor));
    },

    onSelectBaseLayer: baseLayer => {
      dispatch(setBaseLayer(baseLayer.value));
    },

    onChangeBaseLayerOpacity: baseLayerOpacity => {
      dispatch(setBaseLayerOpacity(_.round(baseLayerOpacity, 2)));
    },

    onChangePointOpacity: pointOpacity => {
      dispatch(setPointOpacity(_.round(pointOpacity, 2)));
    },

    onChangePointSize: pointSize => {
      dispatch(setPointSize(_.round(pointSize, 2)));
    },

    onSelectColorScale: colorScale => {
      dispatch(setColorScale(...colorScale.scale));
    },

    onSelectColorPalette: palette => {
      dispatch(setColorPalette(palette));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ColorsAndStylePane);
