import _ from 'lodash';
import React from 'react';
import Styleguide from 'socrata-components';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { translate } from '../../../I18n';

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
import DebouncedInput from '../shared/DebouncedInput';
import DebouncedTextArea from '../shared/DebouncedTextArea';

import {
  getPrimaryColor,
  getSecondaryColor,
  getPointOpacity,
  getPointSize,
  getColorScale,
  getColorPalette,
  getBaseLayer,
  getBaseLayerOpacity,
  getShowDimensionLabels,
  getShowValueLabels,
  getShowValueLabelsAsPercent,
  getAxisLabels,
  getTitle,
  getDescription,
  getViewSourceDataLink,
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
  setBaseLayerOpacity,
  setShowDimensionLabels,
  setShowValueLabels,
  setShowValueLabelsAsPercent,
  setLabelTop,
  setLabelBottom,
  setLabelLeft,
  setTitle,
  setDescription,
  setViewSourceDataLink
} from '../../actions';

export var PresentationPane = React.createClass({
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

    return (
      <div>
        <label className="block-label" htmlFor="primary-color">{labelText}</label>
        <Styleguide.ColorPicker handleColorChange={onChangePrimaryColor} value={primaryColor} palette={COLORS}/>
      </div>
    );
  },

  renderSecondaryColor(labelText) {
    var { vifAuthoring, onChangeSecondaryColor } = this.props;
    var secondaryColor = getSecondaryColor(vifAuthoring);

    return (
      <div>
        <label className="block-label" htmlFor="secondary-color">{labelText}</label>
        <Styleguide.ColorPicker handleColorChange={onChangeSecondaryColor} value={secondaryColor} palette={COLORS}/>
      </div>
    );
  },

  renderDimensionLabels() {
    const { vifAuthoring } = this.props;
    const inputAttributes = {
      id: 'show-dimension-labels',
      type: 'checkbox',
      onChange: this.props.onChangeShowDimensionLabels,
      defaultChecked: getShowDimensionLabels(vifAuthoring)
    };

    return (
      <div className="authoring-field">
        <div className="checkbox">
          <input {...inputAttributes}/>
          <label className="inline-label" htmlFor="show-dimension-labels">
                <span className="fake-checkbox">
                  <span className="icon-checkmark3"></span>
                </span>
            {translate('panes.presentation.fields.show_dimension_labels.title')}
          </label>
        </div>
      </div>
    );
  },

  renderLabels() {
    const { vifAuthoring } = this.props;

    const valueLabelsVisible = isBarChart(vifAuthoring) || isPieChart(vifAuthoring);
    const valueLabels = valueLabelsVisible ? this.renderShowValueLabels() : null;

    const valueLabelsAsPercent = isPieChart(vifAuthoring) ? this.renderShowPercentLabels() : null;

    const dimensionLabelsVisible = isBarChart(vifAuthoring) || isColumnChart(vifAuthoring);
    const dimensionLabels = dimensionLabelsVisible ? this.renderDimensionLabels() : null;

    return (
      <AccordionPane key="labels" title={translate('panes.presentation.subheaders.labels')}>
        {dimensionLabels}
        {valueLabels}
        {valueLabelsAsPercent}
      </AccordionPane>
    );
  },

  renderShowValueLabels() {
    const { vifAuthoring } = this.props;
    const inputAttributes = {
      id: 'show-value-labels',
      type: 'checkbox',
      onChange: this.props.onChangeShowValueLabels,
      defaultChecked: getShowValueLabels(vifAuthoring)
    };

    return (
      <div className="authoring-field">
        <div className="checkbox">
          <input {...inputAttributes}/>
          <label className="inline-label" htmlFor="show-value-labels">
              <span className="fake-checkbox">
                <span className="icon-checkmark3"></span>
              </span>
            {translate('panes.presentation.fields.show_value_labels.title')}
          </label>
        </div>
      </div>
    );
  },

  renderShowPercentLabels() {
    const { vifAuthoring } = this.props;
    const showLabels = getShowValueLabels(vifAuthoring);

    const inputAttributes = {
      id: 'show-value-labels-as-percent',
      type: 'checkbox',
      onChange: this.props.onChangeShowValueLabelsAsPercent,
      defaultChecked: getShowValueLabelsAsPercent(vifAuthoring),
      disabled: !showLabels
    };

    const authoringFieldClasses = classNames('authoring-field', {
      disabled: !showLabels
    });

    return (
      <div className={authoringFieldClasses}>
        <div className="checkbox">
          <input {...inputAttributes}/>
          <label className="inline-label" htmlFor="show-value-labels-as-percent">
              <span className="fake-checkbox">
                <span className="icon-checkmark3"></span>
              </span>
            {translate('panes.presentation.fields.show_value_labels_as_percent.title')}
          </label>
        </div>
      </div>
    );
  },

  renderBarChartVisualizationLabels() {
    const { vifAuthoring, onChangeLabelTop, onChangeLabelLeft } = this.props;
    const axisLabels = getAxisLabels(vifAuthoring);
    const topAxisLabel = _.get(axisLabels, 'top', '');
    const leftAxisLabel = _.get(axisLabels, 'left', '');

    return (
      <AccordionPane key="axis-labels" title={translate('panes.presentation.subheaders.axis_titles')}>
        <div className="authoring-field">
          <label className="block-label" htmlFor="label-top">
            {translate('panes.presentation.fields.top_axis_title.title')}
          </label>
          <DebouncedInput value={topAxisLabel} onChange={onChangeLabelTop} id="label-top" className="text-input" />
        </div>
        <div className="authoring-field">
          <label className="block-label" htmlFor="label-left">
            {translate('panes.presentation.fields.left_axis_title.title')}
          </label>
          <DebouncedInput value={leftAxisLabel} onChange={onChangeLabelLeft} id="label-left" className="text-input" />
        </div>
      </AccordionPane>
    );
  },

  renderVisualizationLabels() {
    const { vifAuthoring, onChangeLabelLeft, onChangeLabelBottom } = this.props;
    const axisLabels = getAxisLabels(vifAuthoring);
    const leftAxisLabel = _.get(axisLabels, 'left', '');
    const bottomAxisLabel = _.get(axisLabels, 'bottom', '');

    return (
      <AccordionPane key="axis-labels" title={translate('panes.presentation.subheaders.axis_titles')}>
        <div className="authoring-field">
          <label className="block-label" htmlFor="label-left">
            {translate('panes.presentation.fields.left_axis_title.title')}
          </label>
          <DebouncedInput value={leftAxisLabel} onChange={onChangeLabelLeft} id="label-left" className="text-input" />
        </div>
        <div className="authoring-field">
          <label className="block-label" htmlFor="label-bottom">
            {translate('panes.presentation.fields.bottom_axis_title.title')}
          </label>
          <DebouncedInput value={bottomAxisLabel} onChange={onChangeLabelBottom} id="label-bottom" className="text-input" />
        </div>
      </AccordionPane>
    );
  },

  renderShowSourceDataLink() {
    const { vifAuthoring } = this.props;
    const inputAttributes = {
      id: 'show-source-data-link',
      type: 'checkbox',
      onChange: this.props.onChangeShowSourceDataLink,
      checked: getViewSourceDataLink(vifAuthoring)
    };

    return (
      <div className="authoring-field checkbox">
        <input {...inputAttributes} />
        <label className="inline-label" htmlFor="show-source-data-link">
          <span className="fake-checkbox">
            <span className="icon-checkmark3"></span>
          </span>
          {translate('panes.presentation.fields.show_source_data_link.title')}
        </label>
      </div>
    );
  },

  renderTitleField() {
    const { vifAuthoring, onChangeTitle } = this.props;
    const title = getTitle(vifAuthoring);

    return (
      <div className="authoring-field">
        <label className="block-label" htmlFor="title">{translate('panes.presentation.fields.title.title')}</label>
        <DebouncedInput id="title" className="text-input" type="text" onChange={onChangeTitle} value={title} />
      </div>
    );
  },

  renderDescriptionField() {
    const { vifAuthoring, onChangeDescription } = this.props;
    const description = getDescription(vifAuthoring);

    return (
      <div className="authoring-field">
        <label className="block-label" htmlFor="description">{translate('panes.presentation.fields.description.title')}</label>
        <DebouncedTextArea id="description" className="text-input text-area" onChange={onChangeDescription} value={description} />
      </div>
    );
  },

  renderGeneral() {
    return (
      <AccordionPane title={translate('panes.presentation.subheaders.general')}>
        {this.renderTitleField()}
        {this.renderDescriptionField()}
        {this.renderShowSourceDataLink()}
      </AccordionPane>
    );
  },

  renderGroupedBarChartControls() {
    const { vifAuthoring, colorPalettes, onSelectColorPalette } = this.props;
    const selectedColorPalette = getColorPalette(vifAuthoring);
    const colorPaletteAttributes = {
      id: 'color-palette',
      options: colorPalettes,
      value: selectedColorPalette,
      onSelection: onSelectColorPalette
    };

    return [
      <AccordionPane key="colors" title={translate('panes.presentation.subheaders.colors')}>
        <label className="block-label"
               htmlFor="color-palette">{translate('panes.presentation.fields.color_palette.title')}</label>
        <div className="color-scale-dropdown-container">
          <Styleguide.Dropdown {...colorPaletteAttributes} />
        </div>
      </AccordionPane>,
      this.renderLabels(),
      this.renderBarChartVisualizationLabels()
    ];
  },

  renderBarChartControls() {
    return [
      <AccordionPane key="colors" title={translate('panes.presentation.subheaders.colors')}>
        {this.renderPrimaryColor(translate('panes.presentation.fields.bar_color.title'))}
      </AccordionPane>,
      this.renderLabels(),
      this.renderBarChartVisualizationLabels()
    ];
  },

  renderGroupedColumnChartControls() {
    const { vifAuthoring, colorPalettes, onSelectColorPalette } = this.props;
    const selectedColorPalette = getColorPalette(vifAuthoring);
    const colorPaletteAttributes = {
      id: 'color-palette',
      options: colorPalettes,
      value: selectedColorPalette,
      onSelection: onSelectColorPalette
    };

    return [
      <AccordionPane key="colors" title={translate('panes.presentation.subheaders.colors')}>
        <label className="block-label"
               htmlFor="color-palette">{translate('panes.presentation.fields.color_palette.title')}</label>
        <div className="color-scale-dropdown-container">
          <Styleguide.Dropdown {...colorPaletteAttributes} />
        </div>
      </AccordionPane>,
      this.renderLabels(),
      this.renderVisualizationLabels()
    ];
  },

  renderColumnChartControls() {
    return [
      <AccordionPane key="colors" title={translate('panes.presentation.subheaders.colors')}>
        {this.renderPrimaryColor(translate('panes.presentation.fields.bar_color.title'))}
      </AccordionPane>,
      this.renderLabels(),
      this.renderVisualizationLabels()
    ];
  },

  renderHistogramControls() {
    return [
      <AccordionPane key="colors" title={translate('panes.presentation.subheaders.colors')}>
        {this.renderPrimaryColor(translate('panes.presentation.fields.bar_color.title'))}
      </AccordionPane>,
      this.renderVisualizationLabels()
    ];
  },

  renderTimelineChartControls() {
    return [
      <AccordionPane key="colors" title={translate('panes.presentation.subheaders.colors')}>
        {this.renderPrimaryColor(translate('panes.presentation.fields.line_color.title'))}
      </AccordionPane>,
      this.renderVisualizationLabels()
    ];
  },

  renderGroupedTimelineChartControls() {
    const { vifAuthoring, colorPalettes, onSelectColorPalette } = this.props;
    const selectedColorPalette = getColorPalette(vifAuthoring);
    const colorPaletteAttributes = {
      id: 'color-palette',
      options: colorPalettes,
      value: selectedColorPalette,
      onSelection: onSelectColorPalette
    };

    return (
      <AccordionPane title={translate('panes.presentation.subheaders.colors')}>
        <label className="block-label"
               htmlFor="color-palette">{translate('panes.presentation.fields.color_palette.title')}</label>
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
      <AccordionPane key="pointControls" title={translate('panes.presentation.subheaders.points')}>
        <div className="authoring-field">
          <label className="block-label"
                 htmlFor="point-color">{translate('panes.presentation.fields.point_color.title')}</label>
          <Styleguide.ColorPicker {...pointColorAttributes} />
        </div>
        <div className="authoring-field">
          <label className="block-label"
                 htmlFor="point-opacity">{translate('panes.presentation.fields.point_opacity.title')}</label>
          <div id="point-opacity">
            <DebouncedSlider {...pointOpacityAttributes} />
          </div>
        </div>
        <div className="authoring-field">
          <label className="block-label"
                 htmlFor="point-size">{translate('panes.presentation.fields.point_size.title')}</label>
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
      <AccordionPane key="colorControls" title={translate('panes.presentation.subheaders.colors')}>
        <label className="block-label"
               htmlFor="color-scale">{translate('panes.presentation.fields.color_scale.title')}</label>
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
      <AccordionPane key="mapLayerControls" title={translate('panes.presentation.subheaders.map')}>
        <div className="authoring-field">
          <label className="block-label"
                 htmlFor="base-layer">{translate('panes.presentation.fields.base_layer.title')}</label>
          <div className="base-layer-dropdown-container">
            <Styleguide.Dropdown {...baseLayerAttributes} />
          </div>
        </div>
        <div className="authoring-field">
          <label className="block-label"
                 htmlFor="base-layer-opacity">{translate('panes.presentation.fields.base_layer_opacity.title')}</label>
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
      onSelection: onSelectColorPalette
    };

    return [
      <AccordionPane key="colors" title={translate('panes.presentation.subheaders.colors')}>
        <label className="block-label"
               htmlFor="color-palette">{translate('panes.presentation.fields.color_palette.title')}</label>
        <div className="color-scale-dropdown-container">
          <Styleguide.Dropdown {...colorPaletteAttributes} />
        </div>
      </AccordionPane>,
      this.renderLabels()
    ];
  },

  renderEmptyPane() {
    return <EmptyPane />;
  },

  render() {
    let configuration = null;
    let showLabels = null;
    let vifAuthoring = this.props.vifAuthoring;

    let general = this.renderGeneral();

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
      general = null;
    }

    return (
      <form>
        <Accordion>
          {general}
          {configuration}
          {showLabels}
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

    onChangeShowDimensionLabels: (event) => {
      const showDimensionLabels = event.target.checked;

      dispatch(setShowDimensionLabels(showDimensionLabels));
    },

    onChangeShowValueLabels: (event) => {
      const showValueLabels = event.target.checked;

      dispatch(setShowValueLabels(showValueLabels));
    },

    onChangeShowValueLabelsAsPercent: (event) => {
      const showValueLabelsAsPercent = event.target.checked;

      dispatch(setShowValueLabelsAsPercent(showValueLabelsAsPercent));
    },

    onChangeLabelTop: (event) => {
      dispatch(setLabelTop(event.target.value));
    },

    onChangeLabelBottom: (event) => {
      dispatch(setLabelBottom(event.target.value));
    },

    onChangeLabelLeft: (event) => {
      dispatch(setLabelLeft(event.target.value));
    },

    onSelectColorScale: colorScale => {
      dispatch(setColorScale(...colorScale.scale));
    },

    onSelectColorPalette: (event) => {
      dispatch(setColorPalette(event.value));
    },

    onChangeTitle: (event) => {
      dispatch(setTitle(event.target.value));
    },

    onChangeDescription: (event) => {
      dispatch(setDescription(event.target.value));
    },

    onChangeShowSourceDataLink: event => {
      const viewSourceDataLink = event.target.checked;
      dispatch(setViewSourceDataLink(viewSourceDataLink));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(PresentationPane);
