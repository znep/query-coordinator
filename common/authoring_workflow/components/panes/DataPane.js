import _ from 'lodash';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import I18n from 'common/i18n';
import {
  getValidMeasures,
  isPointMapColumn,
  isLineMapColumn,
  isBoundaryMapColumn,
  hasData,
  hasError,
  isDimensionTypeCalendarDate,
  isLoading
} from '../../selectors/metadata';
import {
  getAnyDimension,
  getDimension,
  getSelectedVisualizationType,
  getSeries,
  getTreatNullValuesAsZero,
  getVisualizationType,
  getXAxisScalingMode,
  hasErrorBars,
  isBarChart,
  isColumnChart,
  isComboChart,
  isGroupingOrMultiSeries,
  isPieChart,
  isMultiSeries,
  isTimelineChart
} from '../../selectors/vifAuthoring';
import {
  setTreatNullValuesAsZero,
  setXAxisScalingMode
} from '../../actions';

import { AccordionContainer, AccordionPane } from 'common/components';
import BlockLabel from '../shared/BlockLabel';
import ComboChartMeasureSelector from '../ComboChartMeasureSelector';
import DimensionGroupingColumnNameSelector from '../DimensionGroupingColumnNameSelector';
import DimensionSelector from '../DimensionSelector';
import DisplayOptions from '../DisplayOptions';
import ErrorBarsOptions from '../ErrorBarsOptions';
import MeasureSelector from '../MeasureSelector';
import RegionSelector from '../RegionSelector';
import SelectedDimensionIndicator from '../SelectedDimensionIndicator';
import TimelinePrecisionSelector from '../TimelinePrecisionSelector';
import PointMapOptionsSelector from '../PointMapOptionsSelector';
import LineMapOptionsSelector from '../LineMapOptionsSelector';
import BoundaryMapOptionsSelector from '../BoundaryMapOptionsSelector';
import PointMapAggregationSelector from '../PointMapAggregationSelector';
import { FeatureFlags } from 'common/feature_flags';

export class DataPane extends Component {
  renderMetadataLoading = () => {
    return (
      <div className="alert">
        <div className="metadata-loading">
          <span className="spinner-default metadata-loading-spinner"></span> {I18n.t('shared.visualizations.panes.data.loading_metadata')}
        </div>
      </div>
    );
  }

  renderMetadataError = () => {
    return (
      <div className="metadata-error alert error">
        <strong>{I18n.t('shared.visualizations.panes.data.uhoh')}</strong> {I18n.t('shared.visualizations.panes.data.loading_metadata_error')}
      </div>
    );
  }

  renderTreatNullValuesAsZero = () => {
    const { vifAuthoring } = this.props;
    const inputAttributes = {
      id: 'treat-null-values-as-zero',
      type: 'checkbox',
      onChange: this.props.onChangeTreatNullValuesAsZero,
      defaultChecked: getTreatNullValuesAsZero(vifAuthoring)
    };

    return (
      <div className="authoring-field checkbox">
        <input {...inputAttributes} />
        <label className="inline-label" htmlFor="treat-null-values-as-zero">
          <span className="fake-checkbox">
            <span className="icon-checkmark3"></span>
          </span>
          {I18n.t('shared.visualizations.panes.data.fields.treat_null_values_as_zero.title')}
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
          {I18n.t('shared.visualizations.panes.data.fields.x_axis_scaling_mode.title')}
        </label>
      </div>
    );
  }

  renderGroupingOptions = () => {
    const { vifAuthoring } = this.props;
    const shouldRender = !isMultiSeries(vifAuthoring) &&
      (isBarChart(vifAuthoring) || isColumnChart(vifAuthoring) || isTimelineChart(vifAuthoring)) &&
      !hasErrorBars(vifAuthoring);

    return shouldRender ? (
      <AccordionPane title={I18n.t('shared.visualizations.panes.data.fields.dimension_grouping_column_name.title')}>
        <DimensionGroupingColumnNameSelector />
      </AccordionPane>
    ) : null;
  }

  renderTimelineOptions = () => {
    const { vifAuthoring } = this.props;
    const shouldRender = isTimelineChart(vifAuthoring);

    return shouldRender ? (
      <AccordionPane title={I18n.t('shared.visualizations.panes.data.subheaders.timeline_options')}>
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
      <AccordionPane title={I18n.t(`shared.visualizations.panes.data.fields.${translationKey}.title`)}>
        <DisplayOptions />
      </AccordionPane>
    ) : null;
  }

  renderErrorBarsOptions = () => {
    const { vifAuthoring } = this.props;
    const shouldRender = (isBarChart(vifAuthoring) || isColumnChart(vifAuthoring) || isComboChart(vifAuthoring)) &&
      !isGroupingOrMultiSeries(vifAuthoring);

    return shouldRender ? (
      <AccordionPane title={I18n.t('shared.visualizations.panes.data.subheaders.error_bars')}>
        <ErrorBarsOptions />
      </AccordionPane>
    ) : null;
  }

  renderMeasureSelector = () => {
    const isNewGLMapEnabled = FeatureFlags.value('enable_new_maps');

    if (isNewGLMapEnabled) {
      return;
    }

    const { vifAuthoring } = this.props;

    const attributes = {
      series: getSeries(vifAuthoring).map((seriesItem, index) => {
        return _.extend({ seriesIndex: index }, seriesItem);
      })
    };

    const measureSelector = isComboChart(vifAuthoring) ?
      <ComboChartMeasureSelector {...attributes} /> :
      <MeasureSelector {...attributes} />;

    return (
      <div className="authoring-field">
        <div className="measure-list-container">
          <BlockLabel
            title={I18n.translate('shared.visualizations.panes.data.fields.combo_chart_measure_selector.title')}
            description={I18n.translate('shared.visualizations.panes.data.fields.combo_chart_measure_selector.description')} />
          {measureSelector}
        </div>
      </div>
    );
  }

  renderRegionSelector = () => {
    const isNewGLMapEnabled = FeatureFlags.value('enable_new_maps');

    if (isNewGLMapEnabled) {
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

    if (isNewGLMapEnabled && getSelectedVisualizationType(vifAuthoring) === 'map') {
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

    if (isNewGLMapEnabled && getSelectedVisualizationType(vifAuthoring) === 'map') {
      const dimension = getDimension(vifAuthoring);
      const isPointMap = isPointMapColumn(metadata, dimension);

      if (isPointMap) {
        return (
          <AccordionPane key="point-aggregation" title={I18n.t('shared.visualizations.panes.data.subheaders.point_aggregation')}>
            <PointMapAggregationSelector />
          </AccordionPane>
        );
      }
    }
  }

  render() {
    const { metadata } = this.props;

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

    const sections = (
      <AccordionContainer>
        <AccordionPane title={I18n.t('shared.visualizations.panes.data.subheaders.data_selection')}>
          <div className="authoring-field">
            <BlockLabel
              htmlFor="dimension-selection"
              title={I18n.t('shared.visualizations.panes.data.fields.dimension.title')}
              description={I18n.t('shared.visualizations.panes.data.fields.dimension.description')} />
            <SelectedDimensionIndicator />
          </div>
          <div className="authoring-field">
            <DimensionSelector />
          </div>
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
