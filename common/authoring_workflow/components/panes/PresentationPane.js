import _ from 'lodash';
import classNames from 'classnames';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import {
  AccordionContainer,
  AccordionPane,
  ColorPicker,
  Dropdown
} from 'common/components';
import I18n from 'common/i18n';
import { VIF_CONSTANTS } from 'common/visualizations/views/mapConstants';

import * as actions from '../../actions';
import BlockLabel from '../shared/BlockLabel';
import ColorPalettePreview from '../shared/ColorPalettePreview';
import {
  BASE_LAYERS,
  COLOR_PALETTES,
  COLOR_PALETTE_VALUES_FOR_MAPS,
  COLOR_PALETTES_FOR_MAPS,
  COLORS,
  COLOR_SCALES,
  getMapSliderDebounceMs,
  SERIES_TYPE_FLYOUT
} from '../../constants';
import DebouncedInput from '../shared/DebouncedInput';
import DebouncedSlider from '../shared/DebouncedSlider';
import DebouncedTextArea from '../shared/DebouncedTextArea';
import EmptyPane from './EmptyPane';
import { getMeasureTitle } from '../../helpers';
import LineWeightPreview from '../shared/LineWeightPreview';
import {
  hasData,
  isBoundaryMapColumn,
  isLineMapColumn,
  isNumericDimensionType,
  isPointMapColumn
} from '../../selectors/metadata';
import PointSizePreview from '../shared/PointSizePreview';
import * as selectors from '../../selectors/vifAuthoring';

const scope = 'shared.visualizations.panes.presentation';

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
      <AccordionPane key="colors" title={I18n.t('subheaders.colors', { scope })}>
        <div>
          <label className="block-label" htmlFor="primary-color">{labelText}</label>
          <ColorPicker {...colorPickerAttributes} />
        </div>
      </AccordionPane>
    );
  }

  renderColorPalette = () => {
    const { vifAuthoring, colorPalettes, onSelectColorPalette } = this.props;
    const colorPaletteFromVif = selectors.getColorPalette(vifAuthoring);
    const hasMultipleNonFlyoutSeries = selectors.hasMultipleNonFlyoutSeries(vifAuthoring);

    let colorPaletteValue;
    let customColorSelector;

    // If single-series and palette=='custom', set colorPaletteValue = colorPaletteFromVif and render the single-series
    // custom color picker.
    //
    if (!hasMultipleNonFlyoutSeries && (colorPaletteFromVif === 'custom')) {
      colorPaletteValue = colorPaletteFromVif;
      customColorSelector = this.renderSingleSeriesCustomColorSelector();
    } else if (hasMultipleNonFlyoutSeries && (colorPaletteFromVif === null)) {
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
        const selectedColorPalette = (hasMultipleNonFlyoutSeries && (event.value === 'custom')) ? null : event.value;
        onSelectColorPalette(selectedColorPalette);
      }
    };

    return (
      <AccordionPane key="colors" title={I18n.t('subheaders.colors', { scope })}>
        <label className="block-label" htmlFor="color-palette">
          {I18n.t('fields.color_palette.title', { scope })}
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

    const nonFlyoutSeries = selectors.getNonFlyoutSeries(vifAuthoring).map((item, index) => {
      return _.extend({ seriesIndex: index }, item);
    });

    const colorSelectors = nonFlyoutSeries.map((item) => {

      const colorPickerAttributes = {
        handleColorChange: (primaryColor) => onChangePrimaryColor(item.seriesIndex, primaryColor),
        palette: COLORS,
        value: item.color.primary
      };

      const title = getMeasureTitle(metadata, item);

      return (
        <div className="custom-color-container" key={item.seriesIndex}>
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
          {I18n.t('custom_color_palette_error', { scope })}
        </div>
      );
    } else {
      return null;
    }
  }

  renderDimensionLabels = () => {
    const { vifAuthoring, onChangeShowDimensionLabels } = this.props;
    const inputAttributes = {
      defaultChecked: selectors.getShowDimensionLabels(vifAuthoring),
      id: 'show-dimension-labels',
      type: 'checkbox',
      onChange: onChangeShowDimensionLabels
    };

    return (
      <div className="authoring-field">
        <div className="checkbox">
          <input {...inputAttributes} />
          <label className="inline-label" htmlFor="show-dimension-labels">
            <span className="fake-checkbox">
              <span className="icon-checkmark3"></span>
            </span>
            {I18n.t('fields.show_dimension_labels.title', { scope })}
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
      <AccordionPane key="labels" title={I18n.t('subheaders.labels', { scope })}>
        {dimensionLabels}
        {valueLabels}
        {valueLabelsAsPercent}
      </AccordionPane>
    );
  }

  renderShowValueLabels = () => {
    const { vifAuthoring, onChangeShowValueLabels } = this.props;
    const inputAttributes = {
      defaultChecked: selectors.getShowValueLabels(vifAuthoring),
      id: 'show-value-labels',
      type: 'checkbox',
      onChange: onChangeShowValueLabels
    };

    return (
      <div className="authoring-field">
        <div className="checkbox">
          <input {...inputAttributes} />
          <label className="inline-label" htmlFor="show-value-labels">
            <span className="fake-checkbox">
              <span className="icon-checkmark3"></span>
            </span>
            {I18n.t('fields.show_value_labels.title', { scope })}
          </label>
        </div>
      </div>
    );
  }

  renderShowPercentLabels = () => {
    const { vifAuthoring, onChangeShowValueLabelsAsPercent } = this.props;
    const showLabels = selectors.getShowValueLabels(vifAuthoring);

    const inputAttributes = {
      defaultChecked: selectors.getShowValueLabelsAsPercent(vifAuthoring),
      disabled: !showLabels,
      id: 'show-value-labels-as-percent',
      type: 'checkbox',
      onChange: onChangeShowValueLabelsAsPercent
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
            {I18n.t('fields.show_value_labels_as_percent.title', { scope })}
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
        I18n.t('fields.bottom_axis_title.title', { scope }),
        _.get(axisLabels, 'bottom', '')
      ) : null;

    const leftLabel = left ?
      this.renderVisualizationLabel(
        'label-left',
        onChangeLabelLeft,
        I18n.t('fields.left_axis_title.title', { scope }),
        _.get(axisLabels, 'left', '')
      ) : null;

    const rightLabel = right ?
      this.renderVisualizationLabel(
        'label-right',
        onChangeLabelRight,
        I18n.t('fields.right_axis_title.title', { scope }),
        _.get(axisLabels, 'right', '')
      ) : null;

    const topLabel = top ?
      this.renderVisualizationLabel(
        'label-top',
        onChangeLabelTop,
        I18n.t('fields.top_axis_title.title', { scope }),
        _.get(axisLabels, 'top', '')
      ) : null;

    return (
      <AccordionPane key="axis-labels" title={I18n.t('subheaders.axis_titles', { scope })}>
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
    const { vifAuthoring, onChangeShowSourceDataLink } = this.props;
    const inputAttributes = {
      checked: selectors.getViewSourceDataLink(vifAuthoring),
      id: 'show-source-data-link',
      type: 'checkbox',
      onChange: onChangeShowSourceDataLink
    };

    return (
      <div className="authoring-field checkbox">
        <input {...inputAttributes} />
        <label className="inline-label" htmlFor="show-source-data-link">
          <span className="fake-checkbox">
            <span className="icon-checkmark3"></span>
          </span>
          {I18n.t('fields.show_source_data_link.title', { scope })}
        </label>
      </div>
    );
  }

  renderTitleField = () => {
    const { vifAuthoring, onChangeTitle } = this.props;
    const title = selectors.getTitle(vifAuthoring);

    return (
      <div className="authoring-field">
        <label className="block-label" htmlFor="title">{I18n.t('fields.title.title', { scope })}</label>
        <DebouncedInput id="title" className="text-input" type="text" onChange={onChangeTitle} value={title} />
      </div>
    );
  }

  renderDescriptionField = () => {
    const { vifAuthoring, onChangeDescription } = this.props;
    const description = selectors.getDescription(vifAuthoring);

    return (
      <div className="authoring-field">
        <label className="block-label" htmlFor="description">{I18n.t('fields.description.title', { scope })}</label>
        <DebouncedTextArea id="description" className="text-input text-area" onChange={onChangeDescription} value={description} />
      </div>
    );
  }

  renderGeneral = () => {
    return (
      <AccordionPane title={I18n.t('subheaders.general', { scope })}>
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
    const labelText = I18n.t('fields.bar_color.title', { scope });

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
    const labelText = I18n.t('fields.bar_color.title', { scope });

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
    const labelText = I18n.t('fields.bar_color.title', { scope });

    return [
      this.renderPrimaryColor(labelText),
      this.renderLabels(),
      this.renderComboChartVisualizationLabels()
    ];
  }

  renderHistogramControls = () => {
    const labelText = I18n.t('fields.bar_color.title', { scope });

    return [
      this.renderPrimaryColor(labelText),
      this.renderVisualizationLabels({ bottom: true, left: true })
    ];
  }

  renderTimelineChartControls = () => {
    const labelText = I18n.t('fields.bar_color.title', { scope });

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
        delay: getMapSliderDebounceMs()
      };

      return (
        <div className="authoring-field">
          <label
            className="block-label"
            htmlFor="point-opacity">{I18n.t('fields.point_opacity.title', { scope })}</label>
          <div id="point-opacity-slider-container">
            <DebouncedSlider {...pointOpacityAttributes} />
          </div>
        </div>
      );
    }
  }

  renderColorPaletteForNewGLMaps = (colorLabelText) => {
    const { vifAuthoring, onSelectColorPalette } = this.props;
    const colorPaletteValue = selectors.getMapColorPalette(vifAuthoring);
    const colorSwatch = COLOR_PALETTE_VALUES_FOR_MAPS[colorPaletteValue](5);
    const colorPaletteAttributes = {
      id: 'color-palette',
      options: COLOR_PALETTES_FOR_MAPS,
      value: colorPaletteValue,
      onSelection: (event) => {
        onSelectColorPalette(event.value);
      }
    };

    return (
      <div>
        <label className="block-label" htmlFor="color-palette">
          {I18n.t('fields.color_palette.title', { scope })}
        </label>
        <div className="color-scale-dropdown-container has-color-palette-preview">
          <ColorPalettePreview colors={colorSwatch} />
          <Dropdown {...colorPaletteAttributes} />
        </div>
      </div>
    );
  }

  renderDataClassesSelector = (disableDropdown = false) => {
    const { vifAuthoring, onNumberOfDataClassesChange } = this.props;
    const numberOfDataClasses = selectors.getNumberOfDataClasses(vifAuthoring);
    const disabled = _.isUndefined(disableDropdown) ? false : disableDropdown;
    const dataClassesAttributes = {
      disabled,
      id: 'data-classes',
      options: _.map(_.range(2, 8), i => ({ title: i.toString(), value: i.toString() })),
      value: numberOfDataClasses.toString(),
      onSelection: (event) => {
        onNumberOfDataClassesChange(event.value);
      }
    };

    return (
      <div className="authoring-field">
        <label className="block-label" htmlFor="data-classes">
          {I18n.t('fields.data_classes.title', { scope })}
        </label>
        <div className="data-classes-dropdown-container">
          <Dropdown {...dataClassesAttributes} />
        </div>
      </div>
    );
  }

  renderLineMapWeightControls = () => {
    const { vifAuthoring } = this.props;
    const isWeighLinesByColumnSelected = selectors.getWeighLinesByColumn(vifAuthoring);
    let LineMapWeightControls = null;

    if (isWeighLinesByColumnSelected) {
      const { onMinimumLineWeightChange, onMaximumLineWeightChange } = this.props;
      const minimumLineWeight = selectors.getMinimumLineWeight(vifAuthoring);
      const maximumLineWeight = selectors.getMaximumLineWeight(vifAuthoring);
      const minimumLineWeightAttributes = {
        id: 'minimum-line-weight',
        rangeMin: VIF_CONSTANTS.LINE_WEIGHT.MIN,
        rangeMax: VIF_CONSTANTS.LINE_WEIGHT.MAX,
        step: 1,
        value: minimumLineWeight,
        onChange: onMinimumLineWeightChange,
        delay: getMapSliderDebounceMs()
      };
      const maximumLineWeightAttributes = {
        id: 'maximum-line-weight',
        rangeMin: VIF_CONSTANTS.LINE_WEIGHT.MIN,
        rangeMax: VIF_CONSTANTS.LINE_WEIGHT.MAX,
        step: 1,
        value: maximumLineWeight,
        onChange: onMaximumLineWeightChange,
        delay: getMapSliderDebounceMs()
      };

      LineMapWeightControls = (
        <div className="line-weight-min-max-selection-container">
          <div className="authoring-field">
            <label
              className="block-label"
              htmlFor="minimum-line-weight">{I18n.t('fields.line_weight.minimum', { scope })}</label>
            <div className="debounced-slider-with-preview">
              <div className="slider-container">
                <DebouncedSlider {...minimumLineWeightAttributes} />
              </div>
              <LineWeightPreview lineWeight={minimumLineWeight} />
            </div>
          </div>

          <div className="authoring-field">
            <label
              className="block-label"
              htmlFor="maximum-line-weight">{I18n.t('fields.line_weight.maximum', { scope })}</label>
            <div className="debounced-slider-with-preview">
              <div className="slider-container">
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
      const lineWeight = selectors.getLineWeight(vifAuthoring);
      const lineWeightAttributes = {
        id: 'line-weight',
        rangeMin: VIF_CONSTANTS.LINE_WEIGHT.MIN,
        rangeMax: VIF_CONSTANTS.LINE_WEIGHT.MAX,
        step: 1,
        value: lineWeight,
        onChange: onChangeLineWeight,
        delay: getMapSliderDebounceMs()
      };

      LineMapWeightControls = (
        <div className="authoring-field">
          <label
            className="block-label"
            htmlFor="line-weight">{I18n.t('fields.line_weight.title', { scope })}</label>
          <DebouncedSlider {...lineWeightAttributes} />
        </div>
      );
    }

    return (
      <AccordionPane key="lineWeightControls" title={I18n.t('subheaders.line_weight', { scope })}>
        {LineMapWeightControls}
      </AccordionPane>
    );
  }

  renderPointMapSizeControls = () => {
    const { vifAuthoring } = this.props;
    const isResizePointsByColumnSelected = selectors.getResizePointsByColumn(vifAuthoring);
    let pointMapSizeControls = null;

    if (isResizePointsByColumnSelected) {
      const { onMinimumPointSizeChange, onMaximumPointSizeChange } = this.props;
      const minimumPointSize = selectors.getMinimumPointSize(vifAuthoring);
      const maximumPointSize = selectors.getMaximumPointSize(vifAuthoring);
      const minimumPointSizeAttributes = {
        id: 'minimum-point-size',
        rangeMin: VIF_CONSTANTS.POINT_MAP_MIN_POINT_SIZE.MIN,
        rangeMax: VIF_CONSTANTS.POINT_MAP_MIN_POINT_SIZE.MAX,
        step: 1,
        value: minimumPointSize,
        onChange: onMinimumPointSizeChange,
        delay: getMapSliderDebounceMs()
      };
      const maximumPointSizeAttributes = {
        id: 'maximum-point-size',
        rangeMin: VIF_CONSTANTS.POINT_MAP_MAX_POINT_SIZE.MIN,
        rangeMax: VIF_CONSTANTS.POINT_MAP_MAX_POINT_SIZE.MAX,
        step: 1,
        value: maximumPointSize,
        onChange: onMaximumPointSizeChange,
        delay: getMapSliderDebounceMs()
      };

      pointMapSizeControls = (
        <div className="point-size-min-max-selection-container">
          <div className="authoring-field">
            <label
              className="block-label"
              htmlFor="minimum-point-size">{I18n.t('fields.point_size.minimum', { scope })}</label>
            <div className="debounced-slider-with-preview">
              <div className="slider-container">
                <DebouncedSlider {...minimumPointSizeAttributes} />
              </div>
              <PointSizePreview pointSize={minimumPointSize} />
            </div>
          </div>

          <div className="authoring-field">
            <label
              className="block-label"
              htmlFor="maximum-point-size">{I18n.t('fields.point_size.maximum', { scope })}</label>
            <div className="debounced-slider-with-preview">
              <div className="slider-container">
                <DebouncedSlider {...maximumPointSizeAttributes} />
              </div>
              <PointSizePreview pointSize={maximumPointSize} />
            </div>
          </div>

          {this.renderDataClassesSelector()}
        </div>
      );
    } else {
      const { onChangePointMapPointSize } = this.props;
      const pointMapPointSize = selectors.getPointMapPointSize(vifAuthoring);
      const pointSizeAttributes = {
        id: 'point-size',
        rangeMin: VIF_CONSTANTS.POINT_MAP_POINT_SIZE.MIN,
        rangeMax: VIF_CONSTANTS.POINT_MAP_POINT_SIZE.MAX,
        step: 1,
        value: pointMapPointSize,
        onChange: onChangePointMapPointSize,
        delay: getMapSliderDebounceMs()
      };

      pointMapSizeControls = (
        <div className="authoring-field">
          <label
            className="block-label"
            htmlFor="point-size">{I18n.t('fields.point_size.title', { scope })}</label>
          <div id="point-size-slider-container">
            <DebouncedSlider {...pointSizeAttributes} />
          </div>
        </div>
      );
    }

    return (
      <AccordionPane key="pointSizeControls" title={I18n.t('subheaders.point_size', { scope })}>
        {pointMapSizeControls}
      </AccordionPane>
    );
  }

  renderSliderControl = ({
    name: name,
    minValue: rangeMin,
    maxValue: rangeMax,
    step: step,
    value: value,
    onChange: onChange,
    description: description
  }) => {
    const attributes = {
      delay: getMapSliderDebounceMs(),
      id: name,
      rangeMin,
      rangeMax,
      step,
      value,
      onChange
    };

    return (
      <div className="authoring-field">
        <BlockLabel
          title={I18n.t(`fields.${name}.title`, { scope })}
          htmlFor={name}
          description={description} />
        <DebouncedSlider {...attributes} />
      </div>
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
    const maxClusteringZoomLevelSlider = this.renderSliderControl(
      {
        name: 'max_clustering_zoom_level',
        minValue: VIF_CONSTANTS.CLUSTERING_ZOOM.MIN,
        maxValue: VIF_CONSTANTS.CLUSTERING_ZOOM.MAX,
        step: 1,
        value: selectors.getMaxClusteringZoomLevel(vifAuthoring),
        onChange: onMaxClusteringZoomLevelChange,
        description: I18n.t('fields.max_clustering_zoom_level.description', { scope })
      }
    );
    const pointThresholdSlider = this.renderSliderControl(
      {
        name: 'point_threshold',
        minValue: VIF_CONSTANTS.POINT_THRESHOLD.MIN,
        maxValue: VIF_CONSTANTS.POINT_THRESHOLD.MAX,
        step: 100,
        value: selectors.getPointThreshold(vifAuthoring),
        onChange: onPointThresholdChange,
        description: I18n.t('fields.point_threshold.description', { scope })
      }
    );
    const clusterRadiusSlider = this.renderSliderControl(
      {
        name: 'cluster_radius',
        minValue: VIF_CONSTANTS.CLUSTER_RADIUS.MIN,
        maxValue: VIF_CONSTANTS.CLUSTER_RADIUS.MAX,
        step: 1,
        value: selectors.getClusterRadius(vifAuthoring),
        onChange: onClusterRadiusChange,
        description: null
      }
    );
    const maxClusterSizeSlider = this.renderSliderControl(
      {
        name: 'max_cluster_size',
        minValue: VIF_CONSTANTS.CLUSTER_SIZE.MIN,
        maxValue: VIF_CONSTANTS.CLUSTER_SIZE.MAX,
        step: 1,
        value: selectors.getMaxClusterSize(vifAuthoring),
        onChange: onMaxClusterSizeChange,
        description: null
      }
    );
    const stackRadiusSlider = this.renderSliderControl(
      {
        name: 'stack_radius',
        minValue: VIF_CONSTANTS.STACK_RADIUS.MIN,
        maxValue: VIF_CONSTANTS.STACK_RADIUS.MAX,
        step: 1,
        value: selectors.getStackRadius(vifAuthoring),
        onChange: onStackRadiusChange,
        description: null
      }
    );

    return (
      <AccordionPane key="clusterControls" title={I18n.t('subheaders.clusters', { scope })}>
        {maxClusteringZoomLevelSlider}
        {/* Defering implementation to spiderifcation story. */}
        {/* Hiding the form field for now. */}
        {/* pointThresholdSlider */}
        {clusterRadiusSlider}
        {maxClusterSizeSlider}
        {stackRadiusSlider}
      </AccordionPane>
    );
  }

  renderRadioButton = (quantificationMethod) => {
    const { vifAuthoring } = this.props;
    const selectedQuantificationMethod = selectors.getQuantificationMethod(vifAuthoring);
    const className = `${quantificationMethod}-quantification-method`;
    const id = `${quantificationMethod}-quantification-method-container`;
    const inputAttributes = {
      checked: selectedQuantificationMethod === quantificationMethod,
      id,
      name: 'quantification-method-options',
      type: 'radio',
      onChange: () => { this.props.onQuantificationMethodChange(quantificationMethod); }
    };

    return (
      <div className={className}>
        <input {...inputAttributes} />
        <label htmlFor={id}>
          <span className="fake-radiobutton" />
          <div className="translation-within-label">
            {I18n.t(`fields.quantification_method.${quantificationMethod}`, { scope })}
          </div>
        </label>
      </div>
    );
  }

  renderQuantificationMethodOptions = () => {
    return (
      <div className="authoring-field">
        <label className="block-label">
          {I18n.t('subheaders.quantification_method', { scope })}
        </label>

        <div className="radiobutton">
          {this.renderRadioButton('numerical')}
          {this.renderRadioButton('categorical')}
        </div>
      </div>
    );
  }

  renderPrimaryColorForMaps = (labelText) => {
    const { vifAuthoring, onChangePrimaryColor } = this.props;
    const primaryColor = selectors.getPrimaryColor(vifAuthoring);

    const colorPickerAttributes = {
      handleColorChange: (primaryColor) => onChangePrimaryColor(0, primaryColor),
      palette: COLORS,
      value: primaryColor
    };

    return (
      <div>
        <label className="block-label">{labelText}</label>
        <ColorPicker {...colorPickerAttributes} />
      </div>
    );
  }

  renderPointMapControls = () => {
    const { vifAuthoring } = this.props;
    const selectedPointAggregation = selectors.getPointAggregation(vifAuthoring);

    if (selectedPointAggregation === 'heat_map') {
      return null;
    }

    const isRegionMap = selectedPointAggregation === 'region_map';
    const colorLabelText = I18n.t('fields.point_color.title', { scope });
    const colorControls = (
      <AccordionPane key="colors" title={I18n.t('subheaders.colors', { scope })}>
        {_.isNull(selectors.getColorPointsByColumn(vifAuthoring)) && !isRegionMap ?
          this.renderPrimaryColorForMaps(colorLabelText) :
          this.renderColorPaletteForNewGLMaps(colorLabelText)}
        {!isRegionMap && this.renderPointOpacityControls()}
        {isRegionMap && this.renderDataClassesSelector()}
      </AccordionPane>
    );

    if (isRegionMap) {
      return [colorControls];
    }

    return [
      colorControls,
      this.renderPointMapSizeControls(),
      this.renderClusterControls()
    ];
  }

  renderLineMapControls = () => {
    const { vifAuthoring } = this.props;
    const colorLabelText = I18n.t('fields.line_color.title', { scope });
    const colorControls = (
      <AccordionPane key="colors" title={I18n.t('subheaders.colors', { scope })}>
        {_.isNull(selectors.getColorLinesByColumn(vifAuthoring)) ?
          this.renderPrimaryColorForMaps(colorLabelText) :
          this.renderColorPaletteForNewGLMaps(colorLabelText)}
      </AccordionPane>
    );

    return [
      colorControls,
      this.renderLineMapWeightControls()
    ];
  }

  renderShapeFillColorControls = () => {
    const { onChangeShapeFillColor, onChangeShapeFillOpacity, vifAuthoring } = this.props;
    const shapeFillColor = selectors.getShapeFillColor(vifAuthoring);
    const shapeFillOpacity = selectors.getShapeFillOpacity(vifAuthoring);
    const shapeFillColorAttributes = {
      id: 'shape-fill-color',
      handleColorChange: onChangeShapeFillColor,
      palette: COLORS,
      value: shapeFillColor
    };
    const shapeFillOpacityAttributes = {
      delay: getMapSliderDebounceMs(),
      id: 'shape-fill-opacity',
      rangeMax: 100,
      rangeMin: 0,
      step: 1,
      value: shapeFillOpacity,
      onChange: onChangeShapeFillOpacity
    };

    return (
      <AccordionPane key="shapeFillColors" title={I18n.t('subheaders.colors', { scope })}>
        <div className="authoring-field">
          <label
            className="block-label"
            htmlFor="shape-fill-color">{I18n.t('fields.shape_fill_color.title', { scope })}</label>
          <ColorPicker {...shapeFillColorAttributes} />
        </div>

        <div className="authoring-field">
          <label
            className="block-label"
            htmlFor="shape-fill-opacity">{I18n.t('fields.shape_fill_opacity.title', { scope })}</label>
          <DebouncedSlider {...shapeFillOpacityAttributes} />
        </div>
      </AccordionPane>
    );
  }

  renderShapeOutlineColorControls = () => {
    const { onChangeShapeOutlineColor, onChangeShapeOutlineWidth, vifAuthoring } = this.props;
    const shapeOutlineColor = selectors.getShapeOutlineColor(vifAuthoring);
    const shapeOutlineWidth = selectors.getShapeOutlineWidth(vifAuthoring);
    const shapeOutlineColorAttributes = {
      id: 'shape-outline-color',
      handleColorChange: onChangeShapeOutlineColor,
      palette: COLORS,
      value: shapeOutlineColor
    };
    const shapeOutlineWidthAttributes = {
      delay: getMapSliderDebounceMs(),
      id: 'shape-outline-width',
      rangeMax: 8,
      rangeMin: 0.5,
      step: 0.5,
      value: shapeOutlineWidth,
      onChange: onChangeShapeOutlineWidth
    };

    return (
      <AccordionPane key="shapeOutlineColors" title={I18n.t('subheaders.shape_outline', { scope })}>
        <div className="authoring-field">
          <label
            className="block-label"
            htmlFor="shape-outline-color">{I18n.t('fields.shape_outline_color.title', { scope })}</label>
          <ColorPicker {...shapeOutlineColorAttributes} />
        </div>

        <div className="authoring-field">
          <label
            className="block-label"
            htmlFor="shape-outline-width">{I18n.t('fields.shape_outline_width.title', { scope })}</label>
          <div className="debounced-slider-with-preview">
            <div className="slider-container">
              <DebouncedSlider {...shapeOutlineWidthAttributes} />
            </div>
            <LineWeightPreview lineWeight={shapeOutlineWidth} />
          </div>
        </div>
      </AccordionPane>
    );
  }

  renderBoundaryMapControls = () => {
    const { vifAuthoring, metadata } = this.props;
    const columnName = selectors.getBoundaryColorByColumn(vifAuthoring);

    if (_.isNull(columnName)) {
      return [this.renderShapeFillColorControls(), this.renderShapeOutlineColorControls()];
    }

    const isNumericalColumnSelected = isNumericDimensionType(metadata, { columnName });
    const disableDataClassesDropdown = selectors.getQuantificationMethod(vifAuthoring) !== 'numerical';

    return (
      <AccordionPane key="colors" title={I18n.t('subheaders.colors', { scope })}>
        {this.renderColorPaletteForNewGLMaps(I18n.t('fields.boundary_color.title', { scope }))}
        {isNumericalColumnSelected && this.renderQuantificationMethodOptions()}
        {isNumericalColumnSelected && this.renderDataClassesSelector(disableDataClassesDropdown)}
      </AccordionPane>
    );
  }

  renderNewGLMapControls = () => {
    const { vifAuthoring, metadata } = this.props;
    const dimension = selectors.getDimension(vifAuthoring);
    const isPointMap = isPointMapColumn(metadata, dimension);
    const isLineMap = isLineMapColumn(metadata, dimension);
    const isBoundaryMap = isBoundaryMapColumn(metadata, dimension);

    if (isPointMap) {
      return this.renderPointMapControls();
    } else if (isLineMap) {
      return this.renderLineMapControls();
    } else if (isBoundaryMap) {
      return this.renderBoundaryMapControls();
    }

    return null;
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
      rangeMin: VIF_CONSTANTS.POINT_OPACITY.MIN,
      rangeMax: VIF_CONSTANTS.POINT_OPACITY.MAX,
      step: 0.1,
      value: pointOpacity / 100,
      onChange: onChangePointOpacity,
      delay: getMapSliderDebounceMs()
    };

    const pointSizeAttributes = {
      id: 'point-size',
      rangeMin: 1,
      rangeMax: 3.2,
      step: 0.1,
      value: pointSize,
      onChange: onChangePointSize,
      delay: getMapSliderDebounceMs()
    };

    const pointControls = (
      <AccordionPane key="pointControls" title={I18n.t('subheaders.points', { scope })}>
        <div className="authoring-field">
          <label
            className="block-label"
            htmlFor="point-color">{I18n.t('fields.point_color.title', { scope })}</label>
          <ColorPicker {...pointColorAttributes} />
        </div>
        <div className="authoring-field">
          <label
            className="block-label"
            htmlFor="point-opacity">{I18n.t('fields.point_opacity.title', { scope })}</label>
          <div id="point-opacity-slider-container">
            <DebouncedSlider {...pointOpacityAttributes} />
          </div>
        </div>
        <div className="authoring-field">
          <label
            className="block-label"
            htmlFor="point-size">{I18n.t('fields.point_size.title', { scope })}</label>
          <div id="point-size-slider-container">
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
      <AccordionPane key="colorControls" title={I18n.t('subheaders.colors', { scope })}>
        <label
          className="block-label"
          htmlFor="color-scale">{I18n.t('fields.color_scale.title', { scope })}</label>
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
      delay: getMapSliderDebounceMs()
    };

    return (
      <AccordionPane key="mapLayerControls" title={I18n.t('subheaders.map', { scope })}>
        <div className="authoring-field">
          <label className="block-label" htmlFor="base-layer">
            {I18n.t('fields.base_layer.title', { scope })}>
          </label>
          <div id="base-layer-slider-container" className="base-layer-dropdown-container">
            <Dropdown {...baseLayerAttributes} />
          </div>
        </div>
        <div className="authoring-field">
          <label className="block-label" htmlFor="base-layer-opacity">
            {I18n.t('fields.base_layer_opacity.title', { scope })}
          </label>
          <div id="base-layer-opacity-slider">
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

      if (selectors.isGroupingOrHasMultipleNonFlyoutSeries(vifAuthoring)) {
        configuration = this.renderGroupedBarChartControls();
      } else {
        configuration = this.renderBarChartControls();
      }

    } else if (selectors.isColumnChart(vifAuthoring)) {

      if (selectors.isGroupingOrHasMultipleNonFlyoutSeries(vifAuthoring)) {
        configuration = this.renderGroupedColumnChartControls();
      } else {
        configuration = this.renderColumnChartControls();
      }

    } else if (selectors.isComboChart(vifAuthoring)) {

      if (selectors.isGroupingOrHasMultipleNonFlyoutSeries(vifAuthoring)) {
        configuration = this.renderGroupedComboChartControls();
      } else {
        configuration = this.renderComboChartControls();
      }

    } else if (selectors.isTimelineChart(vifAuthoring)) {

      if (selectors.isGroupingOrHasMultipleNonFlyoutSeries(vifAuthoring)) {
        configuration = this.renderGroupedTimelineChartControls();
      } else {
        configuration = this.renderTimelineChartControls();
      }

    } else if (selectors.isHistogram(vifAuthoring)) {
      configuration = this.renderHistogramControls();
    } else if (selectors.isNewGLMap(vifAuthoring)) {
      configuration = this.renderNewGLMapControls();
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

    onSelectBaseLayer: (baseLayer) => {
      dispatch(actions.setBaseLayer(baseLayer.value));
    },

    onChangeBaseLayerOpacity: (baseLayerOpacity) => {
      dispatch(actions.setBaseLayerOpacity(_.round(baseLayerOpacity, 2)));
    },

    onChangePointOpacity: (pointOpacity) => {
      dispatch(actions.setPointOpacity(_.round(pointOpacity, 2)));
    },

    onChangePointSize: (pointSize) => {
      dispatch(actions.setPointSize(_.round(pointSize, 2)));
    },

    onChangePointMapPointSize: (pointMapPointSize) => {
      dispatch(actions.setPointMapPointSize(_.round(pointMapPointSize, 2)));
    },

    onChangeLineWeight: (lineWeight) => {
      dispatch(actions.setLineWeight(_.round(lineWeight, 2)));
    },

    onMinimumLineWeightChange: (lineWeight) => {
      dispatch(actions.setMinimumLineWeight(_.round(lineWeight, 2)));
    },

    onMaximumLineWeightChange: (lineWeight) => {
      dispatch(actions.setMaximumLineWeight(_.round(lineWeight, 2)));
    },

    onMinimumPointSizeChange: (pointSize) => {
      dispatch(actions.setMinimumPointSize(_.round(pointSize, 2)));
    },

    onMaximumPointSizeChange: (pointSize) => {
      dispatch(actions.setMaximumPointSize(_.round(pointSize, 2)));
    },

    onNumberOfDataClassesChange: (numberOfDataClasses) => {
      dispatch(actions.setNumberOfDataClasses(numberOfDataClasses));
    },

    onMaxClusteringZoomLevelChange: (zoomLevel) => {
      dispatch(actions.setMaxClusteringZoomLevel(zoomLevel));
    },

    onPointThresholdChange: (pointThreshold) => {
      dispatch(actions.setPointThreshold(pointThreshold));
    },

    onClusterRadiusChange: (clusterRadius) => {
      dispatch(actions.setClusterRadius(clusterRadius));
    },

    onMaxClusterSizeChange: (maxClusterSize) => {
      dispatch(actions.setMaxClusterSize(maxClusterSize));
    },

    onStackRadiusChange: (stackRadius) => {
      dispatch(actions.setStackRadius(stackRadius));
    },

    onQuantificationMethodChange: (quantificationMethod) => {
      dispatch(actions.setQuantificationMethod(quantificationMethod));
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

    onSelectColorScale: (colorScale) => {
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

    onChangeShowSourceDataLink: (event) => {
      const viewSourceDataLink = event.target.checked;
      dispatch(actions.setViewSourceDataLink(viewSourceDataLink));
    },

    onChangeShapeFillColor: (shapeFillColor) => {
      dispatch(actions.setShapeFillColor(shapeFillColor));
    },

    onChangeShapeFillOpacity: (shapeFillOpacity) => {
      dispatch(actions.setShapeFillOpacity(_.round(shapeFillOpacity, 2)));
    },

    onChangeShapeOutlineColor: (shapeOutlineColor) => {
      dispatch(actions.setShapeOutlineColor(shapeOutlineColor));
    },

    onChangeShapeOutlineWidth: (lineWidth) => {
      dispatch(actions.setShapeOutlineWidth(_.round(lineWidth, 2)));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(PresentationPane);
