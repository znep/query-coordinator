import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import { Dropdown } from 'common/components';
import I18n from 'common/i18n';
import { 
  hasData, 
  hasError,
  isLoading
} from '../../selectors/metadata';
import {
  getPrecision,
  getSeriesFromVif,
  getTreatNullValuesAsZero,
  getVisualizationType,
  isBarChart,
  isPieChart,
  isColumnChart,
  isTimelineChart,
} from '../../selectors/vifAuthoring';
import { TIMELINE_PRECISION } from '../../constants';
import {
  setPrecision,
  setTreatNullValuesAsZero
} from '../../actions';

import Accordion from '../shared/Accordion';
import AccordionPane from '../shared/AccordionPane';
import BlockLabel from '../shared/BlockLabel';
import DebouncedInput from '../shared/DebouncedInput';
import DimensionGroupingColumnNameSelector from '../DimensionGroupingColumnNameSelector';
import DimensionSelector from '../DimensionSelector';
import DisplayOptions from '../DisplayOptions';
import MeasureSelector from '../MeasureSelector';
import RegionSelector from '../RegionSelector';
import SelectedDimensionIndicator from '../SelectedDimensionIndicator';

export var DataPane = React.createClass({
  propTypes: {
    metadata: React.PropTypes.object,
    vifAuthoring: React.PropTypes.object
  },

  getDefaultProps() {
    return {
      timelinePrecision: _.cloneDeep(TIMELINE_PRECISION)
    };
  },

  renderMetadataLoading() {
    return (
      <div className="alert">
        <div className="metadata-loading">
          <span className="spinner-default metadata-loading-spinner"></span> {I18n.t('shared.visualizations.panes.data.loading_metadata')}
        </div>
      </div>
    );
  },

  renderMetadataError() {
    return (
      <div className="metadata-error alert error">
        <strong>{I18n.t('shared.visualizations.panes.data.uhoh')}</strong> {I18n.t('shared.visualizations.panes.data.loading_metadata_error')}
      </div>
    );
  },

  renderTimelinePrecision() {
    const { onSelectTimelinePrecision, timelinePrecision, vifAuthoring } = this.props;
    const defaultPrecision = getPrecision(vifAuthoring) || null;
    const options = _.map(timelinePrecision, (option) => {
      option.render = this.renderTimelinePrecisionOption;
      return option;
    });

    const attributes = {
      options,
      onSelection: onSelectTimelinePrecision,
      id: 'timeline-precision-selection',
      value: defaultPrecision
    };

    return (
      <div className="authoring-field">
        <label className="block-label" htmlFor="timeline-precision">
          {I18n.t('shared.visualizations.panes.data.fields.timeline_precision.title')}
        </label>
        <div id="timeline-precision" className="authoring-field">
          <Dropdown {...attributes} />
        </div>
      </div>
    );
  },

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
  },

  renderGroupingOptions() {
    const { vifAuthoring } = this.props;
    const series = getSeriesFromVif(vifAuthoring);
    const dimensionGroupingAvailable = (isBarChart(vifAuthoring) || isColumnChart(vifAuthoring) || isTimelineChart(vifAuthoring)) &&
        (series.length == 1);

    return dimensionGroupingAvailable ? (
        <AccordionPane title={I18n.t('shared.visualizations.panes.data.fields.dimension_grouping_column_name.title')}>
          <DimensionGroupingColumnNameSelector />
        </AccordionPane>
      ) :
      null;
  },

  renderTimelineOptions() {
    const { vifAuthoring } = this.props;
    const timelinePrecision = this.renderTimelinePrecision();
    const treatNullValuesAsZero = this.renderTreatNullValuesAsZero();

    return isTimelineChart(vifAuthoring) ? (
        <AccordionPane title={I18n.t('shared.visualizations.panes.data.subheaders.timeline_options')}>
          {timelinePrecision}
          {treatNullValuesAsZero}
        </AccordionPane>
      ) :
      null;
  },

  renderDisplayOptions() {
    const { vifAuthoring } = this.props;
    const showLimitAndShowOtherCategory =
      isBarChart(vifAuthoring) ||
      isPieChart(vifAuthoring) ||
      isColumnChart(vifAuthoring);

    const visualizationType = getVisualizationType(vifAuthoring);
    const translationKeys = {
      barChart: 'bar_chart_limit',
      pieChart: 'pie_chart_limit',
      columnChart: 'column_chart_limit'
    };
    const translationKey = translationKeys[visualizationType];

    return showLimitAndShowOtherCategory ? (
        <AccordionPane title={I18n.t(`shared.visualizations.panes.data.fields.${translationKey}.title`)}>
          <DisplayOptions />
        </AccordionPane>
      ) : 
      null;
  },

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

    const sections = (
      <Accordion>
        <AccordionPane title={I18n.t('shared.visualizations.panes.data.subheaders.data_selection')}>
          <div className="authoring-field">
            <BlockLabel
              htmlFor="dimension-selection"
              title={I18n.t('shared.visualizations.panes.data.fields.dimension.title')}
              description={I18n.t('shared.visualizations.panes.data.fields.dimension.description')}/>
            <SelectedDimensionIndicator />
          </div>
          <div className="authoring-field">
            <DimensionSelector/>
          </div>
          <div className="authoring-field">
            <MeasureSelector/>
          </div>
          <div className="authoring-field">
            <RegionSelector/>
          </div>
        </AccordionPane>
        {groupingOptions}
        {timelineOptions}
        {displayOptions}
      </Accordion>
    );

    return (
      <form>
        {metadataInfo ? metadataInfo : sections}
      </form>
    );
  }
});

function mapStateToProps(state) {
  return {
    metadata: state.metadata,
    vifAuthoring: state.vifAuthoring
  };
}

function mapDispatchToProps(dispatch) {
  return {

    onSelectTimelinePrecision: (timelinePrecision) => {
      dispatch(setPrecision(timelinePrecision.value));
    },

    onChangeTreatNullValuesAsZero: (event) => {
      const treatNullValuesAsZero = event.target.checked;

      dispatch(setTreatNullValuesAsZero(treatNullValuesAsZero));
    },
  };
}
export default connect(mapStateToProps, mapDispatchToProps)(DataPane);
