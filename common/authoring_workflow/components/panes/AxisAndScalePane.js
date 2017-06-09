import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import { Dropdown } from 'common/components';
import { I18n } from 'common/visualizations';

import { CHART_SORTING } from '../../constants';
import {
  setOrderBy,
  setMeasureAxisMinValue,
  setMeasureAxisMaxValue,
} from '../../actions';
import {
  getOrderBy,
  getMeasureAxisMinValue,
  getMeasureAxisMaxValue,
  isBarChart,
  isColumnChart,
  isHistogram,
  isTimelineChart,
  isPieChart
} from '../../selectors/vifAuthoring';

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
      chartSorting: _.cloneDeep(CHART_SORTING)
    };
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
      onSelection: (chartSorting) => onSelectChartSorting(chartSorting),
      id: 'chart-sorting-selection',
      value: `${defaultChartSort.parameter}-${defaultChartSort.sort}`
    };

    return (
      <AccordionPane title={I18n.translate('panes.axis_and_scale.subheaders.chart_sorting')}>
        <div className="authoring-field">
          <Dropdown {...attributes} />
        </div>
      </AccordionPane>
    );
  },

  onMeasureAxisScaleControlChange(event) {
    this.setState({
      measureAxisScaleControl: event.target.value
    });

    if (event.target.value == 'automatic') {
      this.props.onMeasureAxisControlAuto();
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
            {I18n.translate('panes.axis_and_scale.fields.scale.minimum')}
          </label>
          <DebouncedInput type="number" value={limitMin} onChange={onMeasureAxisMinValueChange} className="text-input" id="measure-axis-scale-custom-min" />
        </div>
        <div>
          <label className="block-label" htmlFor="measure-axis-scale-custom-max">
            {I18n.translate('panes.axis_and_scale.fields.scale.maximum')}
          </label>
          <DebouncedInput type="number" value={limitMax} onChange={onMeasureAxisMaxValueChange} className="text-input" id="measure-axis-scale-custom-max" />
        </div>
      </div>
    );

    return (
      <AccordionPane title={I18n.translate('panes.axis_and_scale.subheaders.scale')}>
        {I18n.translate('panes.axis_and_scale.fields.scale.title')}

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
              <div className="translation-within-label">{I18n.translate('panes.axis_and_scale.fields.scale.automatic')}</div>
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
              <div className="translation-within-label">{I18n.translate('panes.axis_and_scale.fields.scale.custom')}</div>
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

  renderBarChartControls() {
    const chartSorting = this.renderChartSorting();
    const measureAxisScaleControl = this.renderMeasureAxisScaleControl();

    return (
      <Accordion>
        {measureAxisScaleControl}
        {chartSorting}
      </Accordion>
    );
  },

  renderColumnChartControls() {
    const chartSorting = this.renderChartSorting();
    const measureAxisScaleControl = this.renderMeasureAxisScaleControl();

    return (
      <Accordion>
        {measureAxisScaleControl}
        {chartSorting}
      </Accordion>
    );
  },

  renderHistogramControls() {
    const measureAxisScaleControl = this.renderMeasureAxisScaleControl();

    return (
      <Accordion>
        {measureAxisScaleControl}
      </Accordion>
    );
  },

  renderTimelineChartControls() {
    const measureAxisScaleControl = this.renderMeasureAxisScaleControl();

    return (
      <Accordion>
        {measureAxisScaleControl}
      </Accordion>
    );
  },

  renderPieChartControls() {
    const chartSorting = this.renderChartSorting();

    return (
      <Accordion>
        {chartSorting}
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
    onSelectChartSorting: (chartSorting) => {
      dispatch(setOrderBy(chartSorting.orderBy));
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
