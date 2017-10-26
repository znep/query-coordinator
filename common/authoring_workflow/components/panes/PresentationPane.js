import _ from 'lodash';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { Dropdown, ColorPicker, AccordionContainer, AccordionPane } from 'common/components';
import I18n from 'common/i18n';
import { getMeasureTitle } from '../../helpers';
import { hasData } from '../../selectors/metadata';

import {
  BASE_LAYERS,
  COLOR_SCALES,
  COLOR_PALETTES,
  COLORS,
  MAP_SLIDER_DEBOUNCE_MILLISECONDS
} from '../../constants';

import EmptyPane from './EmptyPane';
import DebouncedSlider from '../shared/DebouncedSlider';
import DebouncedInput from '../shared/DebouncedInput';
import DebouncedTextArea from '../shared/DebouncedTextArea';
import * as selectors from '../../selectors/vifAuthoring';
import * as actions from '../../actions';

export class PresentationPane extends Component {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'onSelectColorScale',
      'renderPrimaryColor',
      'renderColorPalette',
      'renderMultiSeriesCustomColorSelector',
      'renderSingleSeriesCustomColorSelector',
      'renderDimensionLabels',
      'renderLabels',
      'renderShowValueLabels',
      'renderShowPercentLabels',
      'renderBarChartVisualizationLabels',
      'renderVisualizationLabels',
      'renderShowSourceDataLink',
      'renderTitleField',
      'renderDescriptionField',
      'renderGeneral',
      'renderGroupedBarChartControls',
      'renderBarChartControls',
      'renderGroupedColumnChartControls',
      'renderColumnChartControls',
      'renderHistogramControls',
      'renderTimelineChartControls',
      'renderGroupedTimelineChartControls',
      'renderFeatureMapControls',
      'renderRegionMapControls',
      'renderMapLayerControls',
      'renderPieChartControls',
      'renderEmptyPane'
    ]);
  }

  componentWillReceiveProps(nextProps) {
    const thisVizType = this.props.vifAuthoring.authoring.selectedVisualizationType;
    const nextVizType = nextProps.vifAuthoring.authoring.selectedVisualizationType;
    const thisSeries = _.get(this.props.vifAuthoring.vifs[thisVizType], 'series[0]');
    const nextSeries = _.get(nextProps.vifAuthoring.vifs[nextVizType], 'series[0]');

    if (
      !_.isEqual(thisVizType, nextVizType) ||
      !_.isEqual(_.get(thisSeries, 'dataSource'), _.get(nextSeries, 'dataSource')) ||
      !_.isEqual(_.get(thisSeries, 'color.palette'), _.get(nextSeries, 'color.palette'))
    ) {
      this.props.onChangeDataSource();
    }
  }

  onSelectColorScale(event) {
    const colorScale = _.find(this.props.colorScales, { value: event.target.value }).scale;
    this.props.onSelectColorScale(colorScale);
  }

  renderPrimaryColor() {
    const { vifAuthoring, onChangePrimaryColor } = this.props;
    const primaryColor = selectors.getPrimaryColor(vifAuthoring);
    const labelText = I18n.t('shared.visualizations.panes.presentation.fields.bar_color.title');

    const colorPickerAttributes = {
      handleColorChange: (primaryColor) => onChangePrimaryColor(0, primaryColor),
      palette: COLORS,
      value: primaryColor
    };

    return (
      <AccordionPane key="colors" title={I18n.t('shared.visualizations.panes.presentation.subheaders.colors')}>
        <div>
          <label className="block-label" htmlFor="primary-color">{labelText}</label>
          <ColorPicker {...colorPickerAttributes} />
        </div>
      </AccordionPane>
    );
  }

  renderColorPalette() {
    const { vifAuthoring, colorPalettes, onSelectColorPalette } = this.props;
    const colorPaletteFromVif = selectors.getColorPalette(vifAuthoring);
    const isMultiSeries = selectors.isMultiSeries(vifAuthoring);

    let colorPaletteValue;
    let customColorSelector;

    // If single-series and palette=='custom', set colorPaletteValue = colorPaletteFromVif and render the single-series
    // custom color picker.
    //
    if (!isMultiSeries && (colorPaletteFromVif === 'custom')) {
      colorPaletteValue = colorPaletteFromVif;
      customColorSelector = this.renderSingleSeriesCustomColorSelector();
    }
    // If multi-series and palette is null, set colorPaletteValue = 'custom' and render the multi-series custom color
    // picker.
    //
    else if (isMultiSeries && (colorPaletteFromVif === null)) {
      colorPaletteValue = 'custom';
      customColorSelector = this.renderMultiSeriesCustomColorSelector();
    } else {
      colorPaletteValue = colorPaletteFromVif;
    }

    const colorPalettesWithCustomOption = [
      ...colorPalettes,
      {
        title: I18n.t('shared.visualizations.color_palettes.custom'),
        value: 'custom'
      }
    ];
    const colorPaletteAttributes = {
      id: 'color-palette',
      options: colorPalettesWithCustomOption,
      value: colorPaletteValue,
      onSelection: (event) => {

        const selectedColorPalette = (isMultiSeries && (event.value === 'custom')) ? null : event.value;
        onSelectColorPalette(selectedColorPalette);
      }
    };

    return (
      <AccordionPane key="colors" title={I18n.t('shared.visualizations.panes.presentation.subheaders.colors')}>
        <label className="block-label" htmlFor="color-palette">
          {I18n.t('shared.visualizations.panes.presentation.fields.color_palette.title')}
        </label>
        <div className="color-scale-dropdown-container">
          <Dropdown {...colorPaletteAttributes} />
        </div>
        {customColorSelector}
      </AccordionPane>
    );
  }

  renderMultiSeriesCustomColorSelector() {
    const { vifAuthoring, onChangePrimaryColor, metadata } = this.props;

    if (!hasData(metadata)) {
      return null;
    }

    const series = selectors.getSeries(vifAuthoring);
    const colorSelectors = series.map((item, index) => {

      const colorPickerAttributes = {
        handleColorChange: (primaryColor) => onChangePrimaryColor(index, primaryColor),
        palette: COLORS,
        value: item.color.primary
      };

      const title = getMeasureTitle(metadata, item);

      return (
        <div className="custom-color-container" key={index}>
          <ColorPicker {...colorPickerAttributes} />
          <label className="color-value">{title}</label>
        </div>
      );
    });

    return (
      <div className="custom-palette-container">
        {colorSelectors}
      </div>
    );
  }

  renderSingleSeriesCustomColorSelector() {
    const { vifAuthoring, onChangeCustomColorPalette } = this.props;
    const dimensionColumnName = selectors.getColorPaletteGroupingColumnName(vifAuthoring);
    const customColorPalette = selectors.getCustomColorPalette(vifAuthoring);
    const customPaletteSelected = selectors.hasCustomColorPalette(vifAuthoring);
    const hasCustomPaletteGrouping = _.has(customColorPalette, dimensionColumnName);
    const hasCustomColorPaletteError = selectors.getCustomColorPaletteError(vifAuthoring);

    if (hasCustomPaletteGrouping && !hasCustomColorPaletteError) {
      const colorSelectors = _.chain(customColorPalette[dimensionColumnName]).
        map((paletteValue, paletteKey) => ({ color: paletteValue.color, index: paletteValue.index, group: paletteKey })).
        filter((palette) => palette.index > -1).
        sortBy('index').
        map((palette) => {
          const customColorPaletteAttributes = {
            handleColorChange: (selectedColor) =>
              onChangeCustomColorPalette(selectedColor, palette.group, dimensionColumnName),
            value: palette.color,
            palette: COLORS
          };
          return (
            <div className="custom-color-container" key={palette.group}>
              <ColorPicker {...customColorPaletteAttributes} />
              <label className="color-value">{palette.group}</label>
            </div>
          );
        }).
        value();

      return (
        <div className="custom-palette-container">
          {colorSelectors}
        </div>
      );
    } else if (customPaletteSelected && hasCustomColorPaletteError) {
      return (
        <div className="custom-color-palette-error alert error">
          {I18n.t('shared.visualizations.panes.presentation.custom_color_palette_error')}
        </div>
      );
    } else {
      return null;
    }
  }

  renderDimensionLabels() {
    const { vifAuthoring } = this.props;
    const inputAttributes = {
      id: 'show-dimension-labels',
      type: 'checkbox',
      onChange: this.props.onChangeShowDimensionLabels,
      defaultChecked: selectors.getShowDimensionLabels(vifAuthoring)
    };

    return (
      <div className="authoring-field">
        <div className="checkbox">
          <input {...inputAttributes} />
          <label className="inline-label" htmlFor="show-dimension-labels">
                <span className="fake-checkbox">
                  <span className="icon-checkmark3"></span>
                </span>
            {I18n.t('shared.visualizations.panes.presentation.fields.show_dimension_labels.title')}
          </label>
        </div>
      </div>
    );
  }

  renderLabels() {
    const { vifAuthoring } = this.props;

    const valueLabelsVisible = (selectors.isBarChart(vifAuthoring) || selectors.isPieChart(vifAuthoring)) &&
      !selectors.isStacked(vifAuthoring) &&
      !selectors.hasErrorBars(vifAuthoring);

    const valueLabels = valueLabelsVisible ? this.renderShowValueLabels() : null;
    const valueLabelsAsPercent = selectors.isPieChart(vifAuthoring) ? this.renderShowPercentLabels() : null;

    const dimensionLabelsVisible = selectors.isBarChart(vifAuthoring) || selectors.isColumnChart(vifAuthoring);
    const dimensionLabels = dimensionLabelsVisible ? this.renderDimensionLabels() : null;

    return (
      <AccordionPane key="labels" title={I18n.t('shared.visualizations.panes.presentation.subheaders.labels')}>
        {dimensionLabels}
        {valueLabels}
        {valueLabelsAsPercent}
      </AccordionPane>
    );
  }

  renderShowValueLabels() {
    const { vifAuthoring } = this.props;
    const inputAttributes = {
      id: 'show-value-labels',
      type: 'checkbox',
      onChange: this.props.onChangeShowValueLabels,
      defaultChecked: selectors.getShowValueLabels(vifAuthoring)
    };

    return (
      <div className="authoring-field">
        <div className="checkbox">
          <input {...inputAttributes} />
          <label className="inline-label" htmlFor="show-value-labels">
              <span className="fake-checkbox">
                <span className="icon-checkmark3"></span>
              </span>
            {I18n.t('shared.visualizations.panes.presentation.fields.show_value_labels.title')}
          </label>
        </div>
      </div>
    );
  }

  renderShowPercentLabels() {
    const { vifAuthoring } = this.props;
    const showLabels = selectors.getShowValueLabels(vifAuthoring);

    const inputAttributes = {
      id: 'show-value-labels-as-percent',
      type: 'checkbox',
      onChange: this.props.onChangeShowValueLabelsAsPercent,
      defaultChecked: selectors.getShowValueLabelsAsPercent(vifAuthoring),
      disabled: !showLabels
    };

    const authoringFieldClasses = classNames('authoring-field', {
      disabled: !showLabels
    });

    return (
      <div className={authoringFieldClasses}>
        <div className="checkbox">
          <input {...inputAttributes} />
          <label className="inline-label" htmlFor="show-value-labels-as-percent">
              <span className="fake-checkbox">
                <span className="icon-checkmark3"></span>
              </span>
            {I18n.t('shared.visualizations.panes.presentation.fields.show_value_labels_as_percent.title')}
          </label>
        </div>
      </div>
    );
  }

  renderBarChartVisualizationLabels() {
    const { vifAuthoring, onChangeLabelTop, onChangeLabelLeft } = this.props;
    const axisLabels = selectors.getAxisLabels(vifAuthoring);
    const topAxisLabel = _.get(axisLabels, 'top', '');
    const leftAxisLabel = _.get(axisLabels, 'left', '');

    return (
      <AccordionPane key="axis-labels" title={I18n.t('shared.visualizations.panes.presentation.subheaders.axis_titles')}>
        <div className="authoring-field">
          <label className="block-label" htmlFor="label-top">
            {I18n.t('shared.visualizations.panes.presentation.fields.top_axis_title.title')}
          </label>
          <DebouncedInput value={topAxisLabel} onChange={onChangeLabelTop} id="label-top" className="text-input" />
        </div>
        <div className="authoring-field">
          <label className="block-label" htmlFor="label-left">
            {I18n.t('shared.visualizations.panes.presentation.fields.left_axis_title.title')}
          </label>
          <DebouncedInput value={leftAxisLabel} onChange={onChangeLabelLeft} id="label-left" className="text-input" />
        </div>
      </AccordionPane>
    );
  }

  renderVisualizationLabels() {
    const { vifAuthoring, onChangeLabelLeft, onChangeLabelBottom } = this.props;
    const axisLabels = selectors.getAxisLabels(vifAuthoring);
    const leftAxisLabel = _.get(axisLabels, 'left', '');
    const bottomAxisLabel = _.get(axisLabels, 'bottom', '');

    return (
      <AccordionPane key="axis-labels" title={I18n.t('shared.visualizations.panes.presentation.subheaders.axis_titles')}>
        <div className="authoring-field">
          <label className="block-label" htmlFor="label-left">
            {I18n.t('shared.visualizations.panes.presentation.fields.left_axis_title.title')}
          </label>
          <DebouncedInput value={leftAxisLabel} onChange={onChangeLabelLeft} id="label-left" className="text-input" />
        </div>
        <div className="authoring-field">
          <label className="block-label" htmlFor="label-bottom">
            {I18n.t('shared.visualizations.panes.presentation.fields.bottom_axis_title.title')}
          </label>
          <DebouncedInput value={bottomAxisLabel} onChange={onChangeLabelBottom} id="label-bottom" className="text-input" />
        </div>
      </AccordionPane>
    );
  }

  renderShowSourceDataLink() {
    const { vifAuthoring } = this.props;
    const inputAttributes = {
      id: 'show-source-data-link',
      type: 'checkbox',
      onChange: this.props.onChangeShowSourceDataLink,
      checked: selectors.getViewSourceDataLink(vifAuthoring)
    };

    return (
      <div className="authoring-field checkbox">
        <input {...inputAttributes} />
        <label className="inline-label" htmlFor="show-source-data-link">
          <span className="fake-checkbox">
            <span className="icon-checkmark3"></span>
          </span>
          {I18n.t('shared.visualizations.panes.presentation.fields.show_source_data_link.title')}
        </label>
      </div>
    );
  }

  renderTitleField() {
    const { vifAuthoring, onChangeTitle } = this.props;
    const title = selectors.getTitle(vifAuthoring);

    return (
      <div className="authoring-field">
        <label className="block-label" htmlFor="title">{I18n.t('shared.visualizations.panes.presentation.fields.title.title')}</label>
        <DebouncedInput id="title" className="text-input" type="text" onChange={onChangeTitle} value={title} />
      </div>
    );
  }

  renderDescriptionField() {
    const { vifAuthoring, onChangeDescription } = this.props;
    const description = selectors.getDescription(vifAuthoring);

    return (
      <div className="authoring-field">
        <label className="block-label" htmlFor="description">{I18n.t('shared.visualizations.panes.presentation.fields.description.title')}</label>
        <DebouncedTextArea id="description" className="text-input text-area" onChange={onChangeDescription} value={description} />
      </div>
    );
  }

  renderGeneral() {
    return (
      <AccordionPane title={I18n.t('shared.visualizations.panes.presentation.subheaders.general')}>
        {this.renderTitleField()}
        {this.renderDescriptionField()}
        {this.renderShowSourceDataLink()}
      </AccordionPane>
    );
  }

  renderGroupedBarChartControls() {
    return [
      this.renderColorPalette(),
      this.renderLabels(),
      this.renderBarChartVisualizationLabels()
    ];
  }

  renderBarChartControls() {
    return [
      this.renderPrimaryColor(),
      this.renderLabels(),
      this.renderBarChartVisualizationLabels()
    ];
  }

  renderGroupedColumnChartControls() {
    return [
      this.renderColorPalette(),
      this.renderLabels(),
      this.renderVisualizationLabels()
    ];
  }

  renderColumnChartControls() {
    return [
      this.renderPrimaryColor(),
      this.renderLabels(),
      this.renderVisualizationLabels()
    ];
  }

  renderHistogramControls() {
    return [
      this.renderPrimaryColor(),
      this.renderVisualizationLabels()
    ];
  }

  renderTimelineChartControls() {
    return [
      this.renderPrimaryColor(),
      this.renderVisualizationLabels()
    ];
  }

  renderGroupedTimelineChartControls() {
    return [
      this.renderColorPalette(),
      this.renderVisualizationLabels()
    ];
  }

  renderFeatureMapControls() {
    var { vifAuthoring, onChangePrimaryColor, onChangePointOpacity, onChangePointSize } = this.props;
    var pointColor = selectors.getPrimaryColor(vifAuthoring);
    var pointOpacity = selectors.getPointOpacity(vifAuthoring);
    var pointSize = selectors.getPointSize(vifAuthoring);

    var pointColorAttributes = {
      handleColorChange: (primaryColor) => onChangePrimaryColor(0, primaryColor),
      palette: COLORS,
      value: pointColor
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
      <AccordionPane key="pointControls" title={I18n.t('shared.visualizations.panes.presentation.subheaders.points')}>
        <div className="authoring-field">
          <label className="block-label"
            htmlFor="point-color">{I18n.t('shared.visualizations.panes.presentation.fields.point_color.title')}</label>
          <ColorPicker {...pointColorAttributes} />
        </div>
        <div className="authoring-field">
          <label className="block-label"
            htmlFor="point-opacity">{I18n.t('shared.visualizations.panes.presentation.fields.point_opacity.title')}</label>
          <div id="point-opacity">
            <DebouncedSlider {...pointOpacityAttributes} />
          </div>
        </div>
        <div className="authoring-field">
          <label className="block-label"
            htmlFor="point-size">{I18n.t('shared.visualizations.panes.presentation.fields.point_size.title')}</label>
          <div id="point-size">
            <DebouncedSlider {...pointSizeAttributes} />
          </div>
        </div>
      </AccordionPane>
    );

    return [pointControls, this.renderMapLayerControls()];
  }

  renderRegionMapControls() {
    var { vifAuthoring, colorScales, onSelectColorScale } = this.props;
    var defaultColorScale = selectors.getColorScale(vifAuthoring);

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
      <AccordionPane key="colorControls" title={I18n.t('shared.visualizations.panes.presentation.subheaders.colors')}>
        <label className="block-label"
          htmlFor="color-scale">{I18n.t('shared.visualizations.panes.presentation.fields.color_scale.title')}</label>
        <div className="color-scale-dropdown-container">
          <Dropdown {...colorScaleAttributes} />
        </div>
      </AccordionPane>
    );

    return [colorControls, this.renderMapLayerControls()];
  }

  renderMapLayerControls() {
    var { vifAuthoring, baseLayers, onSelectBaseLayer, onChangeBaseLayerOpacity } = this.props;
    var defaultBaseLayer = selectors.getBaseLayer(vifAuthoring);
    var defaultBaseLayerOpacity = selectors.getBaseLayerOpacity(vifAuthoring);

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
      <AccordionPane key="mapLayerControls" title={I18n.t('shared.visualizations.panes.presentation.subheaders.map')}>
        <div className="authoring-field">
          <label className="block-label"
            htmlFor="base-layer">{I18n.t('shared.visualizations.panes.presentation.fields.base_layer.title')}</label>
          <div className="base-layer-dropdown-container">
            <Dropdown {...baseLayerAttributes} />
          </div>
        </div>
        <div className="authoring-field">
          <label className="block-label"
            htmlFor="base-layer-opacity">{I18n.t('shared.visualizations.panes.presentation.fields.base_layer_opacity.title')}</label>
          <div id="base-layer-opacity">
            <DebouncedSlider {...baseLayerOpacityAttributes} />
          </div>
        </div>
      </AccordionPane>
    );
  }

  renderPieChartControls() {
    return [
      this.renderColorPalette(),
      this.renderLabels()
    ];
  }

  renderEmptyPane() {
    return <EmptyPane />;
  }

  render() {
    let configuration = null;
    let showLabels = null;
    let vifAuthoring = this.props.vifAuthoring;

    let general = this.renderGeneral();

    if (selectors.isBarChart(vifAuthoring)) {

      if (selectors.isGroupingOrMultiSeries(vifAuthoring)) {
        configuration = this.renderGroupedBarChartControls();
      } else {
        configuration = this.renderBarChartControls();
      }

    } else if (selectors.isColumnChart(vifAuthoring)) {

      if (selectors.isGroupingOrMultiSeries(vifAuthoring)) {
        configuration = this.renderGroupedColumnChartControls();
      } else {
        configuration = this.renderColumnChartControls();
      }

    } else if (selectors.isTimelineChart(vifAuthoring)) {

      if (selectors.isGroupingOrMultiSeries(vifAuthoring)) {
        configuration = this.renderGroupedTimelineChartControls();
      } else {
        configuration = this.renderTimelineChartControls();
      }

    } else if (selectors.isHistogram(vifAuthoring)) {
      configuration = this.renderHistogramControls();
    } else if (selectors.isFeatureMap(vifAuthoring)) {
      configuration = this.renderFeatureMapControls();
    } else if (selectors.isRegionMap(vifAuthoring)) {
      configuration = this.renderRegionMapControls();
    } else if (selectors.isPieChart(vifAuthoring)) {
      configuration = this.renderPieChartControls();
    } else {
      configuration = this.renderEmptyPane();
      general = null;
    }

    return (
      <form>
        <AccordionContainer>
          {general}
          {configuration}
          {showLabels}
        </AccordionContainer>
      </form>
    );
  }
}

PresentationPane.defaultProps = {
  baseLayers: BASE_LAYERS,
  colorScales: COLOR_SCALES,
  colorPalettes: COLOR_PALETTES
};

function mapStateToProps(state) {
  return {
    vifAuthoring: state.vifAuthoring,
    metadata: state.metadata
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onChangePrimaryColor: (seriesIndex, primaryColor) => {
      dispatch(actions.setPrimaryColor(seriesIndex, primaryColor));
    },

    onSelectBaseLayer: baseLayer => {
      dispatch(actions.setBaseLayer(baseLayer.value));
    },

    onChangeBaseLayerOpacity: baseLayerOpacity => {
      dispatch(actions.setBaseLayerOpacity(_.round(baseLayerOpacity, 2)));
    },

    onChangePointOpacity: pointOpacity => {
      dispatch(actions.setPointOpacity(_.round(pointOpacity, 2)));
    },

    onChangePointSize: pointSize => {
      dispatch(actions.setPointSize(_.round(pointSize, 2)));
    },

    onChangeShowDimensionLabels: (event) => {
      const showDimensionLabels = event.target.checked;

      dispatch(actions.setShowDimensionLabels(showDimensionLabels));
    },

    onChangeShowValueLabels: (event) => {
      const showValueLabels = event.target.checked;

      dispatch(actions.setShowValueLabels(showValueLabels));
    },

    onChangeShowValueLabelsAsPercent: (event) => {
      const showValueLabelsAsPercent = event.target.checked;

      dispatch(actions.setShowValueLabelsAsPercent(showValueLabelsAsPercent));
    },

    onChangeLabelTop: (event) => {
      dispatch(actions.setLabelTop(event.target.value));
    },

    onChangeLabelBottom: (event) => {
      dispatch(actions.setLabelBottom(event.target.value));
    },

    onChangeLabelLeft: (event) => {
      dispatch(actions.setLabelLeft(event.target.value));
    },

    onSelectColorScale: colorScale => {
      dispatch(actions.setColorScale(...colorScale.scale));
    },

    onSelectColorPalette: (colorPalette) => {
      dispatch(actions.setColorPalette(colorPalette));
    },

    onChangeCustomColorPalette: (selectedColor, group, dimensionColumnName) => {
      dispatch(actions.updateCustomColorPalette(selectedColor, group, dimensionColumnName));
    },

    onChangeDataSource: () => {
      dispatch(actions.setColorPaletteProperties());
    },

    onChangeTitle: (event) => {
      dispatch(actions.setTitle(event.target.value));
    },

    onChangeDescription: (event) => {
      dispatch(actions.setDescription(event.target.value));
    },

    onChangeShowSourceDataLink: event => {
      const viewSourceDataLink = event.target.checked;
      dispatch(actions.setViewSourceDataLink(viewSourceDataLink));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(PresentationPane);
