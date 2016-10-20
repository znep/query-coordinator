import _ from 'lodash';
import React from 'react';
import Styleguide from 'socrata-components';
import { connect } from 'react-redux';

import { translate } from '../../../I18n';
import { INPUT_DEBOUNCE_MILLISECONDS, CHART_SORTING, TIMELINE_PRECISION } from '../../constants';
import {
  setLabelTop,
  setLabelBottom,
  setLabelLeft,
  setShowDimensionLabels,
  setShowValueLabels,
  setShowValueLabelsAsPercent,
  setOrderBy,
  setPrecision,
  setTreatNullValuesAsZero
} from '../../actions';
import {
  getAxisLabels,
  getOrderBy,
  getPrecision,
  getTreatNullValuesAsZero,
  getShowDimensionLabels,
  getShowValueLabels,
  getShowValueLabelsAsPercent,
  isBarChart,
  isColumnChart,
  isHistogram,
  isTimelineChart,
  isPieChart
} from '../../selectors/vifAuthoring';

import CustomizationTabPane from '../CustomizationTabPane';
import EmptyPane from './EmptyPane';

export var AxisAndScalePane = React.createClass({
  propTypes: {
    chartSorting: React.PropTypes.arrayOf(React.PropTypes.object),
    timelinePrecision: React.PropTypes.arrayOf(React.PropTypes.object)
  },

  getDefaultProps() {
    return {
      chartSorting: _.cloneDeep(CHART_SORTING),
      timelinePrecision: _.cloneDeep(TIMELINE_PRECISION)
    };
  },

  renderBarChartVisualizationLabels() {
    const { vifAuthoring } = this.props;
    const axisLabels = getAxisLabels(vifAuthoring);
    const topAxisLabel = _.get(axisLabels, 'top', null);
    const leftAxisLabel = _.get(axisLabels, 'left', null);

    const labelTopInputAttributes = {
      className: 'text-input',
      id: 'label-top',
      type: 'text',
      onChange: this.props.onChangeLabelTop,
      defaultValue: topAxisLabel
    };

    const labelLeftInputAttributes = {
      className: 'text-input',
      id: 'label-left',
      type: 'text',
      onChange: this.props.onChangeLabelLeft,
      defaultValue: leftAxisLabel
    };

    return (
      <div className="authoring-field-group">
        <h5>{translate('panes.axis_and_scale.subheaders.axis_titles')}</h5>
        <div className="authoring-field">
          <label className="block-label" htmlFor="label-top">
            {translate('panes.axis_and_scale.fields.top_axis_title.title')}
          </label>
          <input {...labelTopInputAttributes} />
        </div>
        <div className="authoring-field">
          <label className="block-label" htmlFor="label-left">
            {translate('panes.axis_and_scale.fields.left_axis_title.title')}
          </label>
          <input {...labelLeftInputAttributes}/>
        </div>
      </div>
    );
  },

  renderVisualizationLabels() {
    const { vifAuthoring } = this.props;
    const axisLabels = getAxisLabels(vifAuthoring);
    const leftAxisLabel = _.get(axisLabels, 'left', null);
    const bottomAxisLabel = _.get(axisLabels, 'bottom', null);

    const labelLeftInputAttributes = {
      className: 'text-input',
      id: 'label-left',
      type: 'text',
      onChange: this.props.onChangeLabelLeft,
      defaultValue: leftAxisLabel
    };

    const labelBottomInputAttributes = {
      className: 'text-input',
      id: 'label-bottom',
      type: 'text',
      onChange: this.props.onChangeLabelBottom,
      defaultValue: bottomAxisLabel
    };

    return (
      <div className="authoring-field-group">
        <h5>{translate('panes.axis_and_scale.subheaders.axis_titles')}</h5>
        <div className="authoring-field">
          <label className="block-label" htmlFor="label-left">
            {translate('panes.axis_and_scale.fields.left_axis_title.title')}
          </label>
          <input {...labelLeftInputAttributes}/>
        </div>
        <div className="authoring-field">
          <label className="block-label" htmlFor="label-bottom">
            {translate('panes.axis_and_scale.fields.bottom_axis_title.title')}
          </label>
          <input {...labelBottomInputAttributes} />
        </div>
      </div>
    );
  },

  renderShowDimensionLabels() {
    const { vifAuthoring } = this.props;
    const inputAttributes = {
      id: 'show-dimension-labels',
      type: 'checkbox',
      onChange: this.props.onChangeShowDimensionLabels,
      defaultChecked: getShowDimensionLabels(vifAuthoring)
    };

    return (
      <div className="authoring-field-group">
        <h5>{translate('panes.axis_and_scale.subheaders.axis_labels')}</h5>
        <div className="authoring-field">
          <div className="checkbox">
            <input {...inputAttributes}/>
            <label className="inline-label" htmlFor="show-dimension-labels">
              <span className="fake-checkbox">
                <span className="icon-checkmark3"></span>
              </span>
              {translate('panes.axis_and_scale.fields.show_dimension_labels.title')}
            </label>
          </div>
        </div>
      </div>
    );
  },

  renderDataLabelField() {
    return (
      <div className="authoring-field-group">
        <h5>{translate('panes.axis_and_scale.subheaders.data_labels')}</h5>
        { this.renderShowValueLabels() }
      </div>
    );
  },

  renderDataLabelFieldsWithPercent() {
    return (
      <div className="authoring-field-group">
        <h5>{translate('panes.axis_and_scale.subheaders.data_labels')}</h5>
        { this.renderShowValueLabels() }
        { this.renderShowPercentLabels() }
      </div>
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
              {translate('panes.axis_and_scale.fields.show_value_labels.title')}
            </label>
          </div>
        </div>
    );
  },

  renderShowPercentLabels() {
    const { vifAuthoring } = this.props;
    const inputAttributes = {
      id: 'show-value-labels-as-percent',
      type: 'checkbox',
      onChange: this.props.onChangeShowValueLabelsAsPercent,
      defaultChecked: getShowValueLabelsAsPercent(vifAuthoring)
    };

    return (
      <div className="authoring-field">
        <div className="checkbox">
          <input {...inputAttributes}/>
          <label className="inline-label" htmlFor="show-value-labels-as-percent">
              <span className="fake-checkbox">
                <span className="icon-checkmark3"></span>
              </span>
            {translate('panes.axis_and_scale.fields.show_value_labels_as_percent.title')}
          </label>
        </div>
      </div>
    );
  },

  renderChartSortingOption(option) {
    return (
      <div className="dataset-column-dropdown-option">
        <span className={option.icon}></span> {option.title}
      </div>
    );
  },

  renderChartSorting() {
    const { onSelectChartSorting, chartSorting, vifAuthoring } = this.props;
    const defaultChartSort = getOrderBy(vifAuthoring) || { parameter: 'measure', sort: 'desc' };
    const options = _.map(chartSorting, (option) => {
      option.value = `${option.orderBy.parameter}-${option.orderBy.sort}`;
      option.render = this.renderChartSortingOption;

      return option;
    });

    const attributes = {
      options,
      onSelection: onSelectChartSorting,
      id: 'chart-sorting-selection',
      value: `${defaultChartSort.parameter}-${defaultChartSort.sort}`
    };

    return (
      <div className="authoring-field-group">
        <h5>{translate('panes.axis_and_scale.subheaders.chart_sorting')}</h5>
        <div className="authoring-field">
          <Styleguide.Dropdown {...attributes} />
        </div>
      </div>
    );
  },

  renderTimelinePrecisionOption(option) {
    return (
      <div className="dataset-column-dropdown-option">
        {option.title}
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
          {translate('panes.axis_and_scale.fields.timeline_precision.title')}
        </label>
        <div id="timeline-precision" className="authoring-field">
          <Styleguide.Dropdown {...attributes} />
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
          {translate('panes.axis_and_scale.fields.treat_null_values_as_zero.title')}
        </label>
      </div>
    );
  },

  renderGroupingAndDisplay() {
    const timelinePrecision = this.renderTimelinePrecision();
    const treatNullValuesAsZero = this.renderTreatNullValuesAsZero();

    return (
      <div className="authoring-field-group">
        <h5>{translate('panes.axis_and_scale.subheaders.grouping_and_display')}</h5>
        {timelinePrecision}
        {treatNullValuesAsZero}
      </div>
    );
  },

  renderBarChartControls() {
    const visualizationLabels = this.renderBarChartVisualizationLabels();
    const showDimensionLabels = this.renderShowDimensionLabels();
    const dataLabelField = this.renderDataLabelField();
    const chartSorting = this.renderChartSorting();

    return (
      <div>
        {visualizationLabels}
        {showDimensionLabels}
        {dataLabelField}
        {chartSorting}
      </div>
    );
  },

  renderColumnChartControls() {
    const visualizationLabels = this.renderVisualizationLabels();
    const showDimensionLabels = this.renderShowDimensionLabels();
    const chartSorting = this.renderChartSorting();

    return (
      <div>
        {visualizationLabels}
        {showDimensionLabels}
        {chartSorting}
      </div>
    );
  },

  renderHistogramControls() {
    return this.renderVisualizationLabels();
  },

  renderTimelineChartControls() {
    const visualizationLabels = this.renderVisualizationLabels();
    const groupingAndDisplay = this.renderGroupingAndDisplay();

    return (
      <div>
        {visualizationLabels}
        {groupingAndDisplay}
      </div>
    );
  },

  renderPieChartControls() {
    const dataLabelFieldsWithPercent = this.renderDataLabelFieldsWithPercent();

    const chartSorting = this.renderChartSorting();

    return (
      <div>
        {chartSorting}
        {dataLabelFieldsWithPercent}
      </div>
    );
  },

  renderEmptyPane() {
    return <EmptyPane />;
  },

  render() {
    const { vifAuthoring } = this.props;

    let configuration;

    if (isBarChart(vifAuthoring)) {
      configuration = this.renderBarChartControls();
    } else if (isColumnChart(vifAuthoring)) {
      configuration = this.renderColumnChartControls();
    } else if (isHistogram(vifAuthoring)) {
      configuration = this.renderHistogramControls();
    } else if (isTimelineChart(vifAuthoring)) {
      configuration = this.renderTimelineChartControls();
    } else if (isPieChart(vifAuthoring)) {
      configuration = this.renderPieChartControls();
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
    vifAuthoring: state.vifAuthoring,
    datasetMetadata: state.datasetMetadata
  };
}

function mapDispatchToProps(dispatch) {

  return {
    onChangeLabelTop: _.debounce(event => {
      const labelTop = event.target.value;

      dispatch(setLabelTop(labelTop));
    }, INPUT_DEBOUNCE_MILLISECONDS),

    onChangeLabelBottom: _.debounce(event => {
      const labelBottom = event.target.value;

      dispatch(setLabelBottom(labelBottom));
    }, INPUT_DEBOUNCE_MILLISECONDS),

    onChangeLabelLeft: _.debounce(event => {
      const labelLeft = event.target.value;

      dispatch(setLabelLeft(labelLeft));
    }, INPUT_DEBOUNCE_MILLISECONDS),

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

    onSelectChartSorting: (chartSorting) => {
      dispatch(setOrderBy(chartSorting.orderBy));
    },

    onSelectTimelinePrecision: (timelinePrecision) => {
      dispatch(setPrecision(timelinePrecision.value));
    },

    onChangeTreatNullValuesAsZero: (event) => {
      const treatNullValuesAsZero = event.target.checked;

      dispatch(setTreatNullValuesAsZero(treatNullValuesAsZero));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(AxisAndScalePane);
