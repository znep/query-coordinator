import _ from 'lodash';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { AccordionContainer, AccordionPane } from 'common/components';
import { FeatureFlags } from 'common/feature_flags';
import I18n from 'common/i18n';

import { setTreatNullValuesAsZero, setXAxisScalingMode } from '../../actions';
import BlockLabel from '../shared/BlockLabel';
import BoundaryMapOptionsSelector from '../BoundaryMapOptionsSelector';
import ComboChartMeasureSelector from '../ComboChartMeasureSelector';
import DimensionGroupingColumnNameSelector from '../DimensionGroupingColumnNameSelector';
import DimensionSelector from '../DimensionSelector';
import DisplayOptions from '../DisplayOptions';
import ErrorBarsOptions from '../ErrorBarsOptions';
import LineMapOptionsSelector from '../LineMapOptionsSelector';
import MeasureSelector from '../MeasureSelector';
import {
  isPointMapColumn,
  isLineMapColumn,
  isBoundaryMapColumn,
  hasError,
  isDimensionTypeCalendarDate,
  isLoading
} from '../../selectors/metadata';
import PointMapAggregationSelector from '../PointMapAggregationSelector';
import PointMapOptionsSelector from '../PointMapOptionsSelector';
import RegionSelector from '../RegionSelector';
import SelectedDimensionIndicator from '../SelectedDimensionIndicator';
import TimelinePrecisionSelector from '../TimelinePrecisionSelector';
import {
  getAnyDimension,
  getDimension,
  getNonFlyoutSeries,
  getTreatNullValuesAsZero,
  getVisualizationType,
  getXAxisScalingMode,
  hasErrorBars,
  hasMultipleNonFlyoutSeries,
  isBarChart,
  isColumnChart,
  isComboChart,
  isGroupingOrHasMultipleNonFlyoutSeries,
  isNewGLMap,
  isPieChart,
  isTimelineChart
} from '../../selectors/vifAuthoring';

const scope = 'shared.visualizations.panes.data';

export class DataPane extends Component {
  renderMetadataLoading = () => {
    return (
      <div className="alert">
        <div className="metadata-loading">
          <span className="spinner-default metadata-loading-spinner"></span> {I18n.t('loading_metadata', { scope })}
        </div>
      </div>
    );
  }

  renderMetadataError = () => {
    return (
      <div className="metadata-error alert error">
        <strong>{I18n.t('uhoh', { scope })}</strong> {I18n.t('loading_metadata_error', { scope })}
      </div>
    );
  }

  renderTreatNullValuesAsZero = () => {
    const { vifAuthoring } = this.props;
    const inputAttributes = {
      defaultChecked: getTreatNullValuesAsZero(vifAuthoring),
      id: 'treat-null-values-as-zero',
      type: 'checkbox',
      onChange: this.props.onChangeTreatNullValuesAsZero
    };

    return (
      <div className="authoring-field checkbox">
        <input {...inputAttributes} />
        <label className="inline-label" htmlFor="treat-null-values-as-zero">
          <span className="fake-checkbox">
            <span className="icon-checkmark3"></span>
          </span>
          {I18n.t('fields.treat_null_values_as_zero.title', { scope })}
        </label>
      </div>
    );
  }

  renderXAxisScalingMode = () => {
    const { metadata, vifAuthoring } = this.props;
    const column = getAnyDimension(vifAuthoring);
    const disabled = !isDimensionTypeCalendarDate(metadata, column);
    const checked = (getXAxisScalingMode(vifAuthoring) === 'fit');

    const containerAttributes = {
      className: classNames('authoring-field checkbox', { disabled }),
      id: 'x-axis-scaling-mode-container'
    };

    const inputAttributes = {
      checked,
      disabled,
      id: 'x-axis-scaling-mode',
      onChange: this.props.onChangeXAxisScalingMode,
      type: 'checkbox'
    };

    return (
      <div {...containerAttributes}>
        <input {...inputAttributes} />
        <label className="inline-label" htmlFor="x-axis-scaling-mode">
          <span className="fake-checkbox">
            <span className="icon-checkmark3"></span>
          </span>
          {I18n.t('fields.x_axis_scaling_mode.title', { scope })}
        </label>
      </div>
    );
  }

  renderGroupingOptions = () => {
    const { vifAuthoring } = this.props;
    const shouldRender = !hasMultipleNonFlyoutSeries(vifAuthoring) &&
      (isBarChart(vifAuthoring) || isColumnChart(vifAuthoring) || isTimelineChart(vifAuthoring)) &&
      !hasErrorBars(vifAuthoring);

    return shouldRender ? (
      <AccordionPane title={I18n.t('fields.dimension_grouping_column_name.title', { scope })}>
        <DimensionGroupingColumnNameSelector />
      </AccordionPane>
    ) : null;
  }

  renderTimelineOptions = () => {
    const { vifAuthoring } = this.props;
    const shouldRender = isTimelineChart(vifAuthoring);

    return shouldRender ? (
      <AccordionPane title={I18n.t('subheaders.timeline_options', { scope })}>
        <TimelinePrecisionSelector />
        {this.renderTreatNullValuesAsZero()}
        {this.renderXAxisScalingMode()}
      </AccordionPane>
    ) : null;
  }

  renderDisplayOptions = () => {
    const { vifAuthoring } = this.props;
    const shouldRender =
      isBarChart(vifAuthoring) ||
      isPieChart(vifAuthoring) ||
      isColumnChart(vifAuthoring) ||
      isComboChart(vifAuthoring);

    const visualizationType = getVisualizationType(vifAuthoring);
    const translationKeys = {
      barChart: 'bar_chart_limit',
      pieChart: 'pie_chart_limit',
      columnChart: 'column_chart_limit',
      comboChart: 'combo_chart_limit'
    };
    const translationKey = translationKeys[visualizationType];

    return shouldRender ? (
      <AccordionPane title={I18n.t(`fields.${translationKey}.title`, { scope })}>
        <DisplayOptions />
      </AccordionPane>
    ) : null;
  }

  renderErrorBarsOptions = () => {
    const { vifAuthoring } = this.props;
    const shouldRender = (isBarChart(vifAuthoring) || isColumnChart(vifAuthoring) || isComboChart(vifAuthoring)) &&
      !isGroupingOrHasMultipleNonFlyoutSeries(vifAuthoring);

    return shouldRender ? (
      <AccordionPane title={I18n.t('subheaders.error_bars', { scope })}>
        <ErrorBarsOptions />
      </AccordionPane>
    ) : null;
  }

  renderMeasureSelector = () => {
    const { vifAuthoring } = this.props;
    const isNewGLMapEnabled = FeatureFlags.value('enable_new_maps');

    if (isNewGLMapEnabled && isNewGLMap(vifAuthoring)) {
      return;
    }

    const nonFlyoutSeries = getNonFlyoutSeries(vifAuthoring).map((item, index) => {
      return _.extend({ seriesIndex: index }, item);
    });

    const shouldRenderAddMeasureLink =
      isBarChart(vifAuthoring) ||
      isColumnChart(vifAuthoring) ||
      isComboChart(vifAuthoring) ||
      isTimelineChart(vifAuthoring);

    const attributes = {
      isFlyoutSeries: false,
      listItemKeyPrefix: 'DataPane',
      series: nonFlyoutSeries,
      shouldRenderAddMeasureLink,
      shouldRenderDeleteMeasureLink: (nonFlyoutSeries.length > 1)
    };

    const measureSelector = isComboChart(vifAuthoring) ?
      <ComboChartMeasureSelector {...attributes} /> :
      <MeasureSelector {...attributes} />;

    return (
      <div className="authoring-field">
        <div className="measure-list-container">
          <BlockLabel
            title={I18n.translate('fields.combo_chart_measure_selector.title', { scope })}
            description={I18n.translate('fields.combo_chart_measure_selector.description', { scope })} />
          {measureSelector}
        </div>
      </div>
    );
  }

  renderRegionSelector = () => {
    const { vifAuthoring } = this.props;
    const isNewGLMapEnabled = FeatureFlags.value('enable_new_maps');

    if (isNewGLMapEnabled && isNewGLMap(vifAuthoring)) {
      return;
    }

    return (
      <div className="authoring-field">
        <RegionSelector />
      </div>
    );
  }

  renderNewMapOptionsSelector = () => {
    const { vifAuthoring, metadata } = this.props;
    const isNewGLMapEnabled = FeatureFlags.value('enable_new_maps');

    if (isNewGLMapEnabled && isNewGLMap(vifAuthoring)) {
      const dimension = getDimension(vifAuthoring);
      const isPointMap = isPointMapColumn(metadata, dimension);
      const isLineMap = isLineMapColumn(metadata, dimension);
      const isBoundaryMap = isBoundaryMapColumn(metadata, dimension);

      return (
        <div className="authoring-field">
          {isPointMap && <PointMapOptionsSelector />}
          {isLineMap && <LineMapOptionsSelector />}
          {isBoundaryMap && <BoundaryMapOptionsSelector />}
        </div>
      );
    }
  }

  renderPointAggregationOptions = () => {
    const { vifAuthoring, metadata } = this.props;
    const isNewGLMapEnabled = FeatureFlags.value('enable_new_maps');

    if (isNewGLMapEnabled && isNewGLMap(vifAuthoring)) {
      const dimension = getDimension(vifAuthoring);
      const isPointMap = isPointMapColumn(metadata, dimension);

      if (isPointMap) {
        return (
          <AccordionPane key="point-aggregation" title={I18n.t('subheaders.point_aggregation', { scope })}>
            <PointMapAggregationSelector />
          </AccordionPane>
        );
      }
    }
  }

  renderDimensionSelector = () => {
    const { vifAuthoring } = this.props;

    const dimensionSelector = (
      <div className="authoring-field" key="dimensionSelector">
        <DimensionSelector />
      </div>
    );

    if (isNewGLMap(vifAuthoring)) {
      const geoColumnSelectorTitle = (
        <BlockLabel
          htmlFor="geo-column-selection"
          key="geoColumnSelectorTitle"
          title={I18n.t('fields.geo_column.title', { scope })} />
      );

      return [geoColumnSelectorTitle, dimensionSelector];
    }

    const selectedDimensionIndicator = (
      <div className="authoring-field" key="selectedDimensionIndicator">
        <BlockLabel
          htmlFor="dimension-selection"
          title={I18n.t('fields.dimension.title', { scope })}
          description={I18n.t('fields.dimension.description', { scope })} />
        <SelectedDimensionIndicator />
      </div>
    );

    return [selectedDimensionIndicator, dimensionSelector];
  }

  render() {
    const { metadata, vifAuthoring } = this.props;

    let metadataInfo;
    if (hasError(metadata)) {
      metadataInfo = this.renderMetadataError();
    } else if (isLoading(metadata)) {
      metadataInfo = this.renderMetadataLoading();
    }

    const groupingOptions = this.renderGroupingOptions();
    const timelineOptions = this.renderTimelineOptions();
    const displayOptions = this.renderDisplayOptions();
    const errorBarsOptions = this.renderErrorBarsOptions();
    const measureSelector = this.renderMeasureSelector();
    const regionSelector = this.renderRegionSelector();
    const renderNewMapOptionsSelector = this.renderNewMapOptionsSelector();
    const renderPointAggregationOptions = this.renderPointAggregationOptions();
    const renderDimensionSelector = this.renderDimensionSelector();

    const sections = (
      <AccordionContainer>
        <AccordionPane title={I18n.t('subheaders.data_selection', { scope })}>
          {renderDimensionSelector}
          {renderNewMapOptionsSelector}
          {measureSelector}
          {regionSelector}
        </AccordionPane>
        {renderPointAggregationOptions}
        {groupingOptions}
        {timelineOptions}
        {displayOptions}
        {errorBarsOptions}
      </AccordionContainer>
    );

    return (
      <form>
        {metadataInfo ? metadataInfo : sections}
      </form>
    );
  }
}

DataPane.propTypes = {
  metadata: PropTypes.object,
  vifAuthoring: PropTypes.object
};

function mapStateToProps(state) {
  return {
    metadata: state.metadata,
    vifAuthoring: state.vifAuthoring
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onChangeTreatNullValuesAsZero: (event) => {
      const treatNullValuesAsZero = event.target.checked;
      dispatch(setTreatNullValuesAsZero(treatNullValuesAsZero));
    },

    onChangeXAxisScalingMode: (event) => {
      const shouldFit = event.target.checked;
      dispatch(setXAxisScalingMode({ shouldFit }));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(DataPane);
