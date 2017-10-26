import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import I18n from 'common/i18n';
import {
  getValidMeasures,
  hasData,
  hasError,
  isLoading
} from '../../selectors/metadata';
import {
  getTreatNullValuesAsZero,
  getVisualizationType,
  hasErrorBars,
  isBarChart,
  isColumnChart,
  isGroupingOrMultiSeries,
  isMultiSeries,
  isPieChart,
  isTimelineChart
} from '../../selectors/vifAuthoring';
import {
  setTreatNullValuesAsZero
} from '../../actions';

import { AccordionContainer, AccordionPane } from 'common/components';
import BlockLabel from '../shared/BlockLabel';
import DimensionGroupingColumnNameSelector from '../DimensionGroupingColumnNameSelector';
import DimensionSelector from '../DimensionSelector';
import DisplayOptions from '../DisplayOptions';
import ErrorBarsOptions from '../ErrorBarsOptions';
import MeasureSelector from '../MeasureSelector';
import RegionSelector from '../RegionSelector';
import SelectedDimensionIndicator from '../SelectedDimensionIndicator';
import TimelinePrecisionSelector from '../TimelinePrecisionSelector';

export class DataPane extends Component {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'renderMetadataLoading',
      'renderMetadataError',
      'renderTreatNullValuesAsZero',
      'renderGroupingOptions',
      'renderTimelineOptions',
      'renderDisplayOptions',
      'renderErrorBarsOptions'
    ]);
  }

  renderMetadataLoading() {
    return (
      <div className="alert">
        <div className="metadata-loading">
          <span className="spinner-default metadata-loading-spinner"></span> {I18n.t('shared.visualizations.panes.data.loading_metadata')}
        </div>
      </div>
    );
  }

  renderMetadataError() {
    return (
      <div className="metadata-error alert error">
        <strong>{I18n.t('shared.visualizations.panes.data.uhoh')}</strong> {I18n.t('shared.visualizations.panes.data.loading_metadata_error')}
      </div>
    );
  }

  renderTreatNullValuesAsZero() {
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

  renderGroupingOptions() {
    const { vifAuthoring } = this.props;
    const shouldRender = !isMultiSeries(vifAuthoring) &&
      (isBarChart(vifAuthoring) || isColumnChart(vifAuthoring) || isTimelineChart(vifAuthoring)) &&
      !hasErrorBars(vifAuthoring);

    return shouldRender ? (
        <AccordionPane title={I18n.t('shared.visualizations.panes.data.fields.dimension_grouping_column_name.title')}>
          <DimensionGroupingColumnNameSelector />
        </AccordionPane>
      ) :
      null;
  }

  renderTimelineOptions() {
    const { vifAuthoring } = this.props;
    const shouldRender = isTimelineChart(vifAuthoring);

    return shouldRender ? (
        <AccordionPane title={I18n.t('shared.visualizations.panes.data.subheaders.timeline_options')}>
          <TimelinePrecisionSelector />
          {this.renderTreatNullValuesAsZero()}
        </AccordionPane>
      ) :
      null;
  }

  renderDisplayOptions() {
    const { vifAuthoring } = this.props;
    const shouldRender = isBarChart(vifAuthoring) || isPieChart(vifAuthoring) || isColumnChart(vifAuthoring);
    const visualizationType = getVisualizationType(vifAuthoring);
    const translationKeys = {
      barChart: 'bar_chart_limit',
      pieChart: 'pie_chart_limit',
      columnChart: 'column_chart_limit'
    };
    const translationKey = translationKeys[visualizationType];

    return shouldRender ? (
        <AccordionPane title={I18n.t(`shared.visualizations.panes.data.fields.${translationKey}.title`)}>
          <DisplayOptions />
        </AccordionPane>
      ) :
      null;
  }

  renderErrorBarsOptions() {
    const { vifAuthoring } = this.props;
    const shouldRender = (isBarChart(vifAuthoring) || isColumnChart(vifAuthoring)) &&
      !isGroupingOrMultiSeries(vifAuthoring);

    return shouldRender ? (
      <AccordionPane title={I18n.t('shared.visualizations.panes.data.subheaders.error_bars')}>
        <ErrorBarsOptions />
      </AccordionPane>
    ) :
    null;
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
          <div className="authoring-field">
            <MeasureSelector />
          </div>
          <div className="authoring-field">
            <RegionSelector />
          </div>
        </AccordionPane>
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
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(DataPane);
