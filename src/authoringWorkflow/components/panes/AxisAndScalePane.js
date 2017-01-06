import _ from 'lodash';
import React from 'react';
import Styleguide from 'socrata-components';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { translate } from '../../../I18n';
import { onDebouncedEvent } from '../../helpers';
import { CHART_SORTING, TIMELINE_PRECISION } from '../../constants';
import {
  setLabelTop,
  setLabelBottom,
  setLabelLeft,
  setShowDimensionLabels,
  setShowValueLabels,
  setShowValueLabelsAsPercent,
  setOrderBy,
  setPrecision,
  setTreatNullValuesAsZero,
  setMeasureAxisMinValue,
  setMeasureAxisMaxValue,
} from '../../actions';
import {
  getAxisLabels,
  getOrderBy,
  getPrecision,
  getTreatNullValuesAsZero,
  getShowDimensionLabels,
  getShowValueLabels,
  getShowValueLabelsAsPercent,
  getMeasureAxisMinValue,
  getMeasureAxisMaxValue,
  isBarChart,
  isColumnChart,
  isHistogram,
  isTimelineChart,
  isPieChart
} from '../../selectors/vifAuthoring';

import CustomizationTabPane from '../CustomizationTabPane';
import EmptyPane from './EmptyPane';
import Accordion from '../shared/Accordion';
import AccordionPane from '../shared/AccordionPane';
import DebouncedInput from '../shared/DebouncedInput';

export var AxisAndScalePane = React.createClass({
  propTypes: {
    chartSorting: React.PropTypes.arrayOf(React.PropTypes.object),
    timelinePrecision: React.PropTypes.arrayOf(React.PropTypes.object)
  },

  getInitialState() {
    const initialState = {
      measureAxisScaleControl: this.props.measureAxisScaleControl || 'automatic'
    };

    return initialState;
  },

  getDefaultProps() {
    return {
      chartSorting: _.cloneDeep(CHART_SORTING),
      timelinePrecision: _.cloneDeep(TIMELINE_PRECISION)
    };
  },

  renderBarChartVisualizationLabels() {
    const { vifAuthoring, onChangeLabelTop, onChangeLabelLeft } = this.props;
    const axisLabels = getAxisLabels(vifAuthoring);
    const topAxisLabel = _.get(axisLabels, 'top', '');
    const leftAxisLabel = _.get(axisLabels, 'left', '');

    return (
      <AccordionPane title={translate('panes.axis_and_scale.subheaders.axis_titles')}>
        <div className="authoring-field">
          <label className="block-label" htmlFor="label-top">
            {translate('panes.axis_and_scale.fields.top_axis_title.title')}
          </label>
          <DebouncedInput value={topAxisLabel} onChange={onChangeLabelTop} id="label-top" className="text-input" />
        </div>
        <div className="authoring-field">
          <label className="block-label" htmlFor="label-left">
            {translate('panes.axis_and_scale.fields.left_axis_title.title')}
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
      <AccordionPane title={translate('panes.axis_and_scale.subheaders.axis_titles')}>
        <div className="authoring-field">
          <label className="block-label" htmlFor="label-left">
            {translate('panes.axis_and_scale.fields.left_axis_title.title')}
          </label>
          <DebouncedInput value={leftAxisLabel} onChange={onChangeLabelLeft} id="label-left" className="text-input" />
        </div>
        <div className="authoring-field">
          <label className="block-label" htmlFor="label-bottom">
            {translate('panes.axis_and_scale.fields.bottom_axis_title.title')}
          </label>
          <DebouncedInput value={bottomAxisLabel} onChange={onChangeLabelBottom} id="label-bottom" className="text-input" />
        </div>
      </AccordionPane>
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
      <AccordionPane title={translate('panes.axis_and_scale.subheaders.axis_labels')}>
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
      </AccordionPane>
    );
  },

  renderDataLabelField() {
    return (
      <AccordionPane title={translate('panes.axis_and_scale.subheaders.data_labels')}>
        { this.renderShowValueLabels() }
      </AccordionPane>
    );
  },

  renderDataLabelFieldsWithPercent() {
    return (
      <AccordionPane title={translate('panes.axis_and_scale.subheaders.data_labels')}>
        { this.renderShowValueLabels() }
        { this.renderShowPercentLabels() }
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
            {translate('panes.axis_and_scale.fields.show_value_labels.title')}
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
      <AccordionPane title={translate('panes.axis_and_scale.subheaders.chart_sorting')}>
        <div className="authoring-field">
          <Styleguide.Dropdown {...attributes} />
        </div>
      </AccordionPane>
    );
  },

  onMeasureAxisScaleControlChange(event) {
    this.setState({
      measureAxisScaleControl: event.target.value
    });

    if (event.target.value == 'automatic') {
      onDebouncedEvent(this, this.props.onMeasureAxisControlAuto)();
    }
  },

  renderMeasureAxisScaleControl() {
    const {
      vifAuthoring,
      onMeasureAxisMinValueChange,
      onMeasureAxisMaxValueChange
    } = this.props;

    let limitMax = getMeasureAxisMaxValue(vifAuthoring);
    if (_.isNull(limitMax)) {
      limitMax = '';
    }

    let limitMin = getMeasureAxisMinValue(vifAuthoring);
    if (_.isNull(limitMin)) {
      limitMin = '';
    }

    const isAuto = this.state.measureAxisScaleControl == 'automatic' &&
      (!limitMin && !limitMax);

    const boundariesPart = (
      <div className="double-column-input-group">
        <div>
          <label className="block-label" htmlFor="measure-axis-scale-custom-min">
            {translate('panes.axis_and_scale.fields.scale.minimum')}
          </label>
          <DebouncedInput value={limitMin} onChange={onMeasureAxisMinValueChange} className="text-input" id="measure-axis-scale-custom-min" />
        </div>
        <div>
          <label className="block-label" htmlFor="measure-axis-scale-custom-max">
            {translate('panes.axis_and_scale.fields.scale.maximum')}
          </label>
          <DebouncedInput value={limitMax} onChange={onMeasureAxisMaxValueChange} className="text-input" id="measure-axis-scale-custom-max" />
        </div>
      </div>
    );

    return (
      <AccordionPane title={translate('panes.axis_and_scale.subheaders.scale')}>
        {translate('panes.axis_and_scale.fields.scale.title')}

        <div className="authoring-field radiobutton">
          <div>
            <input type="radio"
                   name="measure-axis-scale"
                   id="measure-axis-scale-automatic"
                   value="automatic"
                   onChange={this.onMeasureAxisScaleControlChange}
                   checked={isAuto}/>
            <label htmlFor="measure-axis-scale-automatic">
              <span className="fake-radiobutton" />
              <div className="translation-within-label">{translate('panes.axis_and_scale.fields.scale.automatic')}</div>
            </label>
          </div>
          <div>
            <input type="radio"
                   name="measure-axis-scale"
                   id="measure-axis-scale-custom"
                   value="custom"
                   onChange={this.onMeasureAxisScaleControlChange}
                   checked={!isAuto}/>
            <label htmlFor="measure-axis-scale-custom">
              <span className="fake-radiobutton" />
              <div className="translation-within-label">{translate('panes.axis_and_scale.fields.scale.custom')}</div>
            </label>
          </div>
        </div>

        {!isAuto ? boundariesPart : null}
      </AccordionPane>
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
      <AccordionPane title={translate('panes.axis_and_scale.subheaders.grouping_and_display')}>
        {timelinePrecision}
        {treatNullValuesAsZero}
      </AccordionPane>
    );
  },

  renderBarChartControls() {
    const visualizationLabels = this.renderBarChartVisualizationLabels();
    const showDimensionLabels = this.renderShowDimensionLabels();
    const dataLabelField = this.renderDataLabelField();
    const chartSorting = this.renderChartSorting();
    const measureAxisScaleControl = this.renderMeasureAxisScaleControl();

    return (
      <Accordion>
        {visualizationLabels}
        {showDimensionLabels}
        {dataLabelField}
        {measureAxisScaleControl}
        {chartSorting}
      </Accordion>
    );
  },

  renderColumnChartControls() {
    const visualizationLabels = this.renderVisualizationLabels();
    const showDimensionLabels = this.renderShowDimensionLabels();
    const chartSorting = this.renderChartSorting();
    const measureAxisScaleControl = this.renderMeasureAxisScaleControl();

    return (
      <Accordion>
        {visualizationLabels}
        {showDimensionLabels}
        {measureAxisScaleControl}
        {chartSorting}
      </Accordion>
    );
  },

  renderHistogramControls() {
    const visualizationLabels = this.renderVisualizationLabels();
    const measureAxisScaleControl = this.renderMeasureAxisScaleControl();

    return (
      <Accordion>
        {visualizationLabels}
        {measureAxisScaleControl}
      </Accordion>
    );
  },

  renderTimelineChartControls() {
    const visualizationLabels = this.renderVisualizationLabels();
    const groupingAndDisplay = this.renderGroupingAndDisplay();
    const measureAxisScaleControl = this.renderMeasureAxisScaleControl();

    return (
      <Accordion>
        {visualizationLabels}
        {groupingAndDisplay}
        {measureAxisScaleControl}
      </Accordion>
    );
  },

  renderPieChartControls() {
    const dataLabelFieldsWithPercent = this.renderDataLabelFieldsWithPercent();

    const chartSorting = this.renderChartSorting();

    return (
      <Accordion>
        {chartSorting}
        {dataLabelFieldsWithPercent}
      </Accordion>
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
    onChangeLabelTop: (event) => {
      dispatch(setLabelTop(event.target.value));
    },

    onChangeLabelBottom: (event) => {
      dispatch(setLabelBottom(event.target.value));
    },

    onChangeLabelLeft: (event) => {
      dispatch(setLabelLeft(event.target.value));
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

    onSelectChartSorting: (chartSorting) => {
      dispatch(setOrderBy(chartSorting.orderBy));
    },

    onSelectTimelinePrecision: (timelinePrecision) => {
      dispatch(setPrecision(timelinePrecision.value));
    },

    onChangeTreatNullValuesAsZero: (event) => {
      const treatNullValuesAsZero = event.target.checked;

      dispatch(setTreatNullValuesAsZero(treatNullValuesAsZero));
    },

    onMeasureAxisMinValueChange: (event) => {
      dispatch(setMeasureAxisMinValue(event.target.value));
    },

    onMeasureAxisMaxValueChange: (event) => {
      dispatch(setMeasureAxisMaxValue(event.target.value));
    },

    onMeasureAxisControlAuto: () => {
      dispatch(setMeasureAxisMinValue());
      dispatch(setMeasureAxisMaxValue());
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(AxisAndScalePane);
