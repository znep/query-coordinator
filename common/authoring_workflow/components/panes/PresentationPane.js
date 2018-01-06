import _ from 'lodash';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { Dropdown, ColorPicker, AccordionContainer, AccordionPane } from 'common/components';
import BlockLabel from '../shared/BlockLabel';
import I18n from 'common/i18n';
import { getMeasureTitle } from '../../helpers';

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
import { hasData, isPointMapColumn, isLineMapColumn } from '../../selectors/metadata';
import PointSizePreview from '../shared/PointSizePreview';
import LineWeightPreview from '../shared/LineWeightPreview';

export class PresentationPane extends Component {
  componentWillReceiveProps = (nextProps) => {
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

  onSelectColorScale = (event) => {
    const colorScale = _.find(this.props.colorScales, { value: event.target.value }).scale;
    this.props.onSelectColorScale(colorScale);
  }

  renderPrimaryColor = (labelText) => {
    const { vifAuthoring, onChangePrimaryColor } = this.props;
    const primaryColor = selectors.getPrimaryColor(vifAuthoring);

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
        {this.renderPointOpacityControls()}
      </AccordionPane>
    );
  }

  renderColorPalette = () => {
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
    } else if (isMultiSeries && (colorPaletteFromVif === null)) {
    // If multi-series and palette is null, set colorPaletteValue = 'custom' and render the multi-series custom color
    // picker.
    //
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

  renderMultiSeriesCustomColorSelector = () => {
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

  renderSingleSeriesCustomColorSelector = () => {
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

  renderDimensionLabels = () => {
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

  renderLabels = () => {
    const { vifAuthoring } = this.props;

    const valueLabelsVisible = (selectors.isBarChart(vifAuthoring) || selectors.isPieChart(vifAuthoring)) &&
      !selectors.isStacked(vifAuthoring) &&
      !selectors.hasErrorBars(vifAuthoring);

    const valueLabels = valueLabelsVisible ? this.renderShowValueLabels() : null;
    const valueLabelsAsPercent = selectors.isPieChart(vifAuthoring) ? this.renderShowPercentLabels() : null;

    const dimensionLabelsVisible = selectors.isBarChart(vifAuthoring) || selectors.isColumnChart(vifAuthoring) || selectors.isComboChart(vifAuthoring);
    const dimensionLabels = dimensionLabelsVisible ? this.renderDimensionLabels() : null;

    return (
      <AccordionPane key="labels" title={I18n.t('shared.visualizations.panes.presentation.subheaders.labels')}>
        {dimensionLabels}
        {valueLabels}
        {valueLabelsAsPercent}
      </AccordionPane>
    );
  }

  renderShowValueLabels = () => {
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

  renderShowPercentLabels = () => {
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

  renderComboChartVisualizationLabels = () => {
    const { vifAuthoring } = this.props;

    const usePrimaryAxis =
      !selectors.getUseSecondaryAxisForColumns(vifAuthoring) ||
      !selectors.getUseSecondaryAxisForLines(vifAuthoring);

    const useSecondaryAxis =
      selectors.getUseSecondaryAxisForColumns(vifAuthoring) ||
      selectors.getUseSecondaryAxisForLines(vifAuthoring);

    return this.renderVisualizationLabels({
      bottom: true,
      left: usePrimaryAxis,
      right: useSecondaryAxis
    });
  }

  renderVisualizationLabels = ({ bottom = false, left = false, right = false, top = false }) => {
    const {
      onChangeLabelBottom,
      onChangeLabelLeft,
      onChangeLabelRight,
      onChangeLabelTop,
      vifAuthoring
    } = this.props;

    const axisLabels = selectors.getAxisLabels(vifAuthoring);

    const bottomLabel = bottom ?
      this.renderVisualizationLabel(
        'label-bottom',
        onChangeLabelBottom,
        I18n.t('shared.visualizations.panes.presentation.fields.bottom_axis_title.title'),
        _.get(axisLabels, 'bottom', '')
      ) : null;

    const leftLabel = left ?
      this.renderVisualizationLabel(
        'label-left',
        onChangeLabelLeft,
        I18n.t('shared.visualizations.panes.presentation.fields.left_axis_title.title'),
        _.get(axisLabels, 'left', '')
      ) : null;

    const rightLabel = right ?
      this.renderVisualizationLabel(
        'label-right',
        onChangeLabelRight,
        I18n.t('shared.visualizations.panes.presentation.fields.right_axis_title.title'),
        _.get(axisLabels, 'right', '')
      ) : null;

    const topLabel = top ?
      this.renderVisualizationLabel(
        'label-top',
        onChangeLabelTop,
        I18n.t('shared.visualizations.panes.presentation.fields.top_axis_title.title'),
        _.get(axisLabels, 'top', '')
      ) : null;

    return (
      <AccordionPane key="axis-labels" title={I18n.t('shared.visualizations.panes.presentation.subheaders.axis_titles')}>
        {leftLabel}
        {rightLabel}
        {bottomLabel}
        {topLabel}
      </AccordionPane>
    );
  }

  renderVisualizationLabel = (id, onChange, title, value) => {
    const labelAttributes = {
      className: 'block-label',
      htmlFor: id
    };

    const inputAttributes = {
      className: 'text-input',
      id,
      onChange,
      value
    };

    return (
      <div className="authoring-field">
        <label {...labelAttributes}>{title}</label>
        <DebouncedInput {...inputAttributes} />
      </div>
    );
  }

  renderShowSourceDataLink = () => {
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

  renderTitleField = () => {
    const { vifAuthoring, onChangeTitle } = this.props;
    const title = selectors.getTitle(vifAuthoring);

    return (
      <div className="authoring-field">
        <label className="block-label" htmlFor="title">{I18n.t('shared.visualizations.panes.presentation.fields.title.title')}</label>
        <DebouncedInput id="title" className="text-input" type="text" onChange={onChangeTitle} value={title} />
      </div>
    );
  }

  renderDescriptionField = () => {
    const { vifAuthoring, onChangeDescription } = this.props;
    const description = selectors.getDescription(vifAuthoring);

    return (
      <div className="authoring-field">
        <label className="block-label" htmlFor="description">{I18n.t('shared.visualizations.panes.presentation.fields.description.title')}</label>
        <DebouncedTextArea id="description" className="text-input text-area" onChange={onChangeDescription} value={description} />
      </div>
    );
  }

  renderGeneral = () => {
    return (
      <AccordionPane title={I18n.t('shared.visualizations.panes.presentation.subheaders.general')}>
        {this.renderTitleField()}
        {this.renderDescriptionField()}
        {this.renderShowSourceDataLink()}
      </AccordionPane>
    );
  }

  renderGroupedBarChartControls = () => {
    return [
      this.renderColorPalette(),
      this.renderLabels(),
      this.renderVisualizationLabels({ left: true, top: true })
    ];
  }

  renderBarChartControls = () => {
    const labelText = I18n.t('shared.visualizations.panes.presentation.fields.bar_color.title');

    return [
      this.renderPrimaryColor(labelText),
      this.renderLabels(),
      this.renderVisualizationLabels({ left: true, top: true })
    ];
  }

  renderGroupedColumnChartControls = () => {
    return [
      this.renderColorPalette(),
      this.renderLabels(),
      this.renderVisualizationLabels({ bottom: true, left: true })
    ];
  }

  renderColumnChartControls = () => {
    const labelText = I18n.t('shared.visualizations.panes.presentation.fields.bar_color.title');

    return [
      this.renderPrimaryColor(labelText),
      this.renderLabels(),
      this.renderVisualizationLabels({ bottom: true, left: true })
    ];
  }

  renderGroupedComboChartControls = () => {
    return [
      this.renderColorPalette(),
      this.renderLabels(),
      this.renderComboChartVisualizationLabels()
    ];
  }

  renderComboChartControls = () => {
    const labelText = I18n.t('shared.visualizations.panes.presentation.fields.bar_color.title');

    return [
      this.renderPrimaryColor(labelText),
      this.renderLabels(),
      this.renderComboChartVisualizationLabels()
    ];
  }

  renderHistogramControls = () => {
    const labelText = I18n.t('shared.visualizations.panes.presentation.fields.bar_color.title');

    return [
      this.renderPrimaryColor(labelText),
      this.renderVisualizationLabels({ bottom: true, left: true })
    ];
  }

  renderTimelineChartControls = () => {
    const labelText = I18n.t('shared.visualizations.panes.presentation.fields.bar_color.title');

    return [
      this.renderPrimaryColor(labelText),
      this.renderVisualizationLabels({ bottom: true, left: true })
    ];
  }

  renderGroupedTimelineChartControls = () => {
    return [
      this.renderColorPalette(),
      this.renderVisualizationLabels({ bottom: true, left: true })
    ];
  }

  renderPointOpacityControls = () => {
    const { vifAuthoring, metadata, onChangePointOpacity } = this.props;
    const dimension = selectors.getDimension(vifAuthoring);
    const isPointMap = isPointMapColumn(metadata, dimension);

    if (selectors.isNewGLMap(vifAuthoring) && isPointMap) {
      const pointOpacity = selectors.getPointOpacity(vifAuthoring);
      const pointOpacityAttributes = {
        id: 'point-opacity',
        rangeMin: 0,
        rangeMax: 100,
        step: 5,
        value: pointOpacity,
        onChange: onChangePointOpacity,
        delay: MAP_SLIDER_DEBOUNCE_MILLISECONDS
      };

      return (
        <div className="authoring-field">
          <label
            className="block-label"
            htmlFor="point-opacity">{I18n.t('shared.visualizations.panes.presentation.fields.point_opacity.title')}</label>
          <div id="point-opacity">
            <DebouncedSlider {...pointOpacityAttributes} />
          </div>
        </div>
      );
    }
  }

  renderMapColorControls = (renderColorPalette, colorLabelText) => {
    if (renderColorPalette) {
      const { vifAuthoring, colorPalettes, onSelectColorPalette } = this.props;
      const colorPaletteValue = selectors.getMapColorPalette(vifAuthoring);
      const colorPaletteAttributes = {
        id: 'color-palette',
        options: colorPalettes,
        value: colorPaletteValue,
        onSelection: (event) => {
          onSelectColorPalette(event.value);
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
          {this.renderPointOpacityControls()}
        </AccordionPane>
      );
    } else {
      return this.renderPrimaryColor(colorLabelText);
    }
  }

  renderDataClassesSelector = () => {
    const { vifAuthoring, onNumberOfDataClassesChange } = this.props;
    const numberOfDataClasses = selectors.getNumberOfDataClasses(vifAuthoring);

    const dataClassesAttributes = {
      id: 'data-classes',
      options: _.map(_.range(2, 8), i => ({ title: i.toString(), value: parseInt(i) })),
      value: numberOfDataClasses,
      onSelection: (event) => {
        onNumberOfDataClassesChange(event.value);
      }
    };

    return (
      <div className="authoring-field">
        <label className="block-label" htmlFor="data-classes">
          {I18n.t('shared.visualizations.panes.presentation.fields.data_classes.title')}
        </label>
        <div className="data-classes-dropdown-container">
          <Dropdown {...dataClassesAttributes} />
        </div>
      </div>
    );
  }

  renderLineMapWeightControls = () => {
    const { vifAuthoring } = this.props;
    const isLineWeightByColumnSelected = selectors.getLineWeightByColumn(vifAuthoring);
    let LineMapWeightControls = null;

    if (isLineWeightByColumnSelected) {
      const { onMinimumLineWeightChange, onMaximumLineWeightChange } = this.props;
      const minimumLineWeight = selectors.getMinimumLineWeight(vifAuthoring);
      const maximumLineWeight = selectors.getMaximumLineWeight(vifAuthoring);
      const minimumLineWeightAttributes = {
        id: 'minimum-line-weight',
        rangeMin: 1,
        rangeMax: 10,
        step: 1,
        value: minimumLineWeight,
        onChange: onMinimumLineWeightChange,
        delay: MAP_SLIDER_DEBOUNCE_MILLISECONDS
      };
      const maximumLineWeightAttributes = {
        id: 'maximum-line-weight',
        rangeMin: 1,
        rangeMax: 10,
        step: 1,
        value: maximumLineWeight,
        onChange: onMaximumLineWeightChange,
        delay: MAP_SLIDER_DEBOUNCE_MILLISECONDS
      };

      LineMapWeightControls = (
        <div className="line-weight-min-max-selection-container">
          <div className="authoring-field">
            <label
              className="block-label"
              htmlFor="minimum-line-weight">{I18n.t('shared.visualizations.panes.presentation.fields.line_weight.minimum')}</label>
            <div id="minimum-line-weight" className="debounced-slider-with-preview">
              <div className="line-weight-slider-container">
                <DebouncedSlider {...minimumLineWeightAttributes} />
              </div>
              <LineWeightPreview lineWeight={minimumLineWeight} />
            </div>
          </div>

          <div className="authoring-field">
            <label
              className="block-label"
              htmlFor="maximum-line-weight">{I18n.t('shared.visualizations.panes.presentation.fields.line_weight.maximum')}</label>
            <div id="maximum-line-weight" className="debounced-slider-with-preview">
              <div className="line-weight-slider-container">
                <DebouncedSlider {...maximumLineWeightAttributes} />
              </div>
              <LineWeightPreview lineWeight={maximumLineWeight} />
            </div>
          </div>

          {this.renderDataClassesSelector()}
        </div>
      );
    } else {
      const { onChangeLineWeight } = this.props;
      const lineWeight = selectors.getLineWeightByColumn(vifAuthoring);
      const lineWeightAttributes = {
        id: 'line-weight',
        rangeMin: 1,
        rangeMax: 3.2,
        step: 0.1,
        value: lineWeight,
        onChange: onChangeLineWeight,
        delay: MAP_SLIDER_DEBOUNCE_MILLISECONDS
      };

      LineMapWeightControls = (
        <div className="authoring-field">
          <label
            className="block-label"
            htmlFor="line-weight">{I18n.t('shared.visualizations.panes.presentation.fields.line_weight.title')}</label>
          <div id="line-weight">
            <DebouncedSlider {...lineWeightAttributes} />
          </div>
        </div>
      );
    }

    return (
      <AccordionPane key="lineWeightControls" title={I18n.t('shared.visualizations.panes.presentation.subheaders.line_weight')}>
        {LineMapWeightControls}
      </AccordionPane>
    );
  }

  renderPointMapSizeControls = () => {
    const { vifAuthoring } = this.props;
    const isPointSizeByColumnSelected = selectors.getPointSizeByColumn(vifAuthoring);
    let pointMapSizeControls = null;

    if (isPointSizeByColumnSelected) {
      const { onMinimumPointSizeChange, onMaximumPointSizeChange } = this.props;
      const minimumPointSize = selectors.getMinimumPointSize(vifAuthoring);
      const maximumPointSize = selectors.getMaximumPointSize(vifAuthoring);
      const minimumPointSizeAttributes = {
        id: 'minimum-point-size',
        rangeMin: 1,
        rangeMax: 10,
        step: 1,
        value: minimumPointSize,
        onChange: onMinimumPointSizeChange,
        delay: MAP_SLIDER_DEBOUNCE_MILLISECONDS
      };
      const maximumPointSizeAttributes = {
        id: 'maximum-point-size',
        rangeMin: 1,
        rangeMax: 10,
        step: 1,
        value: maximumPointSize,
        onChange: onMaximumPointSizeChange,
        delay: MAP_SLIDER_DEBOUNCE_MILLISECONDS
      };

      pointMapSizeControls = (
        <div className="point-size-min-max-selection-container">
          <div className="authoring-field">
            <label
              className="block-label"
              htmlFor="minimum-point-size">{I18n.t('shared.visualizations.panes.presentation.fields.point_size.minimum')}</label>
            <div id="minimum-point-size" className="debounced-slider-with-preview">
              <div className="point-size-slider-container">
                <DebouncedSlider {...minimumPointSizeAttributes} />
              </div>
              <PointSizePreview pointSize={minimumPointSize} />
            </div>
          </div>

          <div className="authoring-field">
            <label
              className="block-label"
              htmlFor="maximum-point-size">{I18n.t('shared.visualizations.panes.presentation.fields.point_size.maximum')}</label>
            <div id="maximum-point-size" className="debounced-slider-with-preview">
              <div className="point-size-slider-container">
                <DebouncedSlider {...maximumPointSizeAttributes} />
              </div>
              <PointSizePreview pointSize={maximumPointSize} />
            </div>
          </div>

          {this.renderDataClassesSelector()}
        </div>
      );
    } else {
      const { onChangePointSize } = this.props;
      const pointSize = selectors.getPointSize(vifAuthoring);
      const pointSizeAttributes = {
        id: 'point-size',
        rangeMin: 1,
        rangeMax: 3.2,
        step: 0.1,
        value: pointSize,
        onChange: onChangePointSize,
        delay: MAP_SLIDER_DEBOUNCE_MILLISECONDS
      };

      pointMapSizeControls = (
        <div className="authoring-field">
          <label
            className="block-label"
            htmlFor="point-size">{I18n.t('shared.visualizations.panes.presentation.fields.point_size.title')}</label>
          <div id="point-size">
            <DebouncedSlider {...pointSizeAttributes} />
          </div>
        </div>
      );
    }

    return (
      <AccordionPane key="pointSizeControls" title={I18n.t('shared.visualizations.panes.presentation.subheaders.point_size')}>
        {pointMapSizeControls}
      </AccordionPane>
    );
  }

  renderClusterControls = () => {
    const { vifAuthoring } = this.props;
    const {
      onMaxClusteringZoomLevelChange,
      onPointThresholdChange,
      onClusterRadiusChange,
      onMaxClusterSizeChange,
      onStackRadiusChange
    } = this.props;
    const maxClusteringZoomLevel = selectors.getMaxClusteringZoomLevel(vifAuthoring);
    const pointThreshold = selectors.getPointThreshold(vifAuthoring);
    const clusterRadius = selectors.getClusterRadius(vifAuthoring);
    const maxClusterSize = selectors.getMaxClusterSize(vifAuthoring);
    const stackRadius = selectors.getStackRadius(vifAuthoring);
    const maxClusteringZoomLevelAttributes = {
      id: 'max-clustering-zoom-level',
      rangeMin: 1,
      rangeMax: 23,
      step: 1,
      value: maxClusteringZoomLevel,
      onChange: onMaxClusteringZoomLevelChange,
      delay: MAP_SLIDER_DEBOUNCE_MILLISECONDS
    };
    const pointThresholdAttributes = {
      id: 'point-threshold',
      rangeMin: 100,
      rangeMax: 10000,
      step: 100,
      value: pointThreshold,
      onChange: onPointThresholdChange,
      delay: MAP_SLIDER_DEBOUNCE_MILLISECONDS
    };
    const clusterRadiusAttributes = {
      id: 'cluster-radius',
      rangeMin: 20,
      rangeMax: 80,
      step: 1,
      value: clusterRadius,
      onChange: onClusterRadiusChange,
      delay: MAP_SLIDER_DEBOUNCE_MILLISECONDS
    };
    const maxClusterSizeAttributes = {
      id: 'max-cluster-size',
      rangeMin: 1,
      rangeMax: 10,
      step: 1,
      value: maxClusterSize,
      onChange: onMaxClusterSizeChange,
      delay: MAP_SLIDER_DEBOUNCE_MILLISECONDS
    };
    const stackRadiusAttributes = {
      id: 'stack-radius',
      rangeMin: 1,
      rangeMax: 80,
      step: 1,
      value: stackRadius,
      onChange: onStackRadiusChange,
      delay: MAP_SLIDER_DEBOUNCE_MILLISECONDS
    };

    return (
      <AccordionPane key="clusterControls" title={I18n.t('shared.visualizations.panes.presentation.subheaders.clusters')}>
        <div className="authoring-field">
          <BlockLabel
            title={I18n.t('shared.visualizations.panes.presentation.fields.stop_clustering_at_zoom_level.title')}
            htmlFor="max-clustering-zoom-level"
            description={I18n.t('shared.visualizations.panes.presentation.fields.stop_clustering_at_zoom_level.description')} />
          <div id="max-clustering-zoom-level">
            <DebouncedSlider {...maxClusteringZoomLevelAttributes} />
          </div>
        </div>

        <div className="authoring-field">
          <BlockLabel
            title={I18n.t('shared.visualizations.panes.presentation.fields.point_threshold.title')}
            htmlFor="point-threshold"
            description={I18n.t('shared.visualizations.panes.presentation.fields.point_threshold.description')} />
          <div id="point-threshold">
            <DebouncedSlider {...pointThresholdAttributes} />
          </div>
        </div>

        <div className="authoring-field">
          <label
            className="block-label"
            htmlFor="cluster-radius">
            {I18n.t('shared.visualizations.panes.presentation.fields.cluster_radius.title')}
          </label>
          <div id="cluster-radius">
            <DebouncedSlider {...clusterRadiusAttributes} />
          </div>
        </div>

        <div className="authoring-field">
          <label
            className="block-label"
            htmlFor="max-cluster-size">
            {I18n.t('shared.visualizations.panes.presentation.fields.max_cluster_size.title')}
          </label>
          <div id="max-cluster-size">
            <DebouncedSlider {...maxClusterSizeAttributes} />
          </div>
        </div>

        <div className="authoring-field">
          <label
            className="block-label"
            htmlFor="stack-radius">
            {I18n.t('shared.visualizations.panes.presentation.fields.stack_radius.title')}
          </label>
          <div id="stack-radius">
            <DebouncedSlider {...stackRadiusAttributes} />
          </div>
        </div>
      </AccordionPane>
    );
  }

  renderNewMapControls = () => {
    const { vifAuthoring, metadata } = this.props;
    const dimension = selectors.getDimension(vifAuthoring);
    const isPointMap = isPointMapColumn(metadata, dimension);
    const isLineMap = isLineMapColumn(metadata, dimension);

    if (isPointMap) {
      const renderColorPalette = !_.isNull(selectors.getPointColorByColumn(vifAuthoring));
      const colorLabelText = I18n.t('shared.visualizations.panes.presentation.fields.point_color.title');
      let mapControls = [this.renderMapLayerControls()];

      if (selectors.getPointAggregation(vifAuthoring) === 'none') {
        mapControls = _.concat([
          this.renderMapColorControls(renderColorPalette, colorLabelText),
          this.renderPointMapSizeControls(),
          this.renderClusterControls()
        ], mapControls);
      }

      return mapControls;
    } else if (isLineMap) {
      const renderColorPalette = !_.isNull(selectors.getLineColorByColumn(vifAuthoring));
      const colorLabelText = I18n.t('shared.visualizations.panes.presentation.fields.line_color.title');

      return [
        this.renderMapColorControls(renderColorPalette, colorLabelText),
        this.renderLineMapWeightControls(),
        this.renderMapLayerControls()
      ];
    }
  }

  renderFeatureMapControls = () => {
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
          <label
            className="block-label"
            htmlFor="point-color">{I18n.t('shared.visualizations.panes.presentation.fields.point_color.title')}</label>
          <ColorPicker {...pointColorAttributes} />
        </div>
        <div className="authoring-field">
          <label
            className="block-label"
            htmlFor="point-opacity">{I18n.t('shared.visualizations.panes.presentation.fields.point_opacity.title')}</label>
          <div id="point-opacity">
            <DebouncedSlider {...pointOpacityAttributes} />
          </div>
        </div>
        <div className="authoring-field">
          <label
            className="block-label"
            htmlFor="point-size">{I18n.t('shared.visualizations.panes.presentation.fields.point_size.title')}</label>
          <div id="point-size">
            <DebouncedSlider {...pointSizeAttributes} />
          </div>
        </div>
      </AccordionPane>
    );

    return [pointControls, this.renderMapLayerControls()];
  }

  renderRegionMapControls = () => {
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
        <label
          className="block-label"
          htmlFor="color-scale">{I18n.t('shared.visualizations.panes.presentation.fields.color_scale.title')}</label>
        <div className="color-scale-dropdown-container">
          <Dropdown {...colorScaleAttributes} />
        </div>
      </AccordionPane>
    );

    return [colorControls, this.renderMapLayerControls()];
  }

  renderMapLayerControls = () => {
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
          <label
            className="block-label"
            htmlFor="base-layer">{I18n.t('shared.visualizations.panes.presentation.fields.base_layer.title')}</label>
          <div className="base-layer-dropdown-container">
            <Dropdown {...baseLayerAttributes} />
          </div>
        </div>
        <div className="authoring-field">
          <label
            className="block-label"
            htmlFor="base-layer-opacity">{I18n.t('shared.visualizations.panes.presentation.fields.base_layer_opacity.title')}</label>
          <div id="base-layer-opacity">
            <DebouncedSlider {...baseLayerOpacityAttributes} />
          </div>
        </div>
      </AccordionPane>
    );
  }

  renderPieChartControls = () => {
    return [
      this.renderColorPalette(),
      this.renderLabels()
    ];
  }

  renderEmptyPane = () => {
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

    } else if (selectors.isComboChart(vifAuthoring)) {

      if (selectors.isGroupingOrMultiSeries(vifAuthoring)) {
        configuration = this.renderGroupedComboChartControls();
      } else {
        configuration = this.renderComboChartControls();
      }

    } else if (selectors.isTimelineChart(vifAuthoring)) {

      if (selectors.isGroupingOrMultiSeries(vifAuthoring)) {
        configuration = this.renderGroupedTimelineChartControls();
      } else {
        configuration = this.renderTimelineChartControls();
      }

    } else if (selectors.isHistogram(vifAuthoring)) {
      configuration = this.renderHistogramControls();
    } else if (selectors.isNewGLMap(vifAuthoring)) {
      configuration = this.renderNewMapControls();
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

    onChangeLineWeight: lineWeight => {
      dispatch(actions.setLineWeight(_.round(lineWeight, 2)));
    },

    onMinimumLineWeightChange: lineWeight => {
      dispatch(actions.setMinimumLineWeight(_.round(lineWeight, 2)));
    },

    onMaximumLineWeightChange: lineWeight => {
      dispatch(actions.setMaximumLineWeight(_.round(lineWeight, 2)));
    },

    onMinimumPointSizeChange: pointSize => {
      dispatch(actions.setMinimumPointSize(_.round(pointSize, 2)));
    },

    onMaximumPointSizeChange: pointSize => {
      dispatch(actions.setMaximumPointSize(_.round(pointSize, 2)));
    },

    onNumberOfDataClassesChange: numberOfDataClasses => {
      dispatch(actions.setNumberOfDataClasses(numberOfDataClasses));
    },

    onMaxClusteringZoomLevelChange: zoomLevel => {
      dispatch(actions.setMaxClusteringZoomLevel(zoomLevel));
    },

    onPointThresholdChange: pointThreshold => {
      dispatch(actions.setPointThreshold(pointThreshold));
    },

    onClusterRadiusChange: clusterRadius => {
      dispatch(actions.setClusterRadius(clusterRadius));
    },

    onMaxClusterSizeChange: maxClusterSize => {
      dispatch(actions.setMaxClusterSize(maxClusterSize));
    },

    onStackRadiusChange: stackRadius => {
      dispatch(actions.setStackRadius(stackRadius));
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

    onChangeLabelRight: (event) => {
      dispatch(actions.setLabelRight(event.target.value));
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
