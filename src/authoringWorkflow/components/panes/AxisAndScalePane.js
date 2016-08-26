import _ from 'lodash';
import React from 'react';
import Styleguide from 'socrata-components';
import { connect } from 'react-redux';

import { translate } from '../../../I18n';
import { INPUT_DEBOUNCE_MILLISECONDS, CHART_SORTING } from '../../constants';
import { setLabelBottom, setLabelLeft, setXAxisDataLabels, setOrderBy } from '../../actions';
import {
  getAxisLabels,
  getOrderBy,
  getXAxisDataLabels,
  isColumnChart,
  isHistogram,
  isTimelineChart
} from '../../selectors/vifAuthoring';

import CustomizationTabPane from '../CustomizationTabPane';
import EmptyPane from './EmptyPane';

export var AxisAndScalePane = React.createClass({
  propTypes: {
    chartSorting: React.PropTypes.arrayOf(React.PropTypes.object)
  },

  getDefaultProps() {
    return {
      chartSorting: _.cloneDeep(CHART_SORTING)
    };
  },

  renderVisualizationLabels() {
    const vifAuthoring = this.props.vifAuthoring;
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

  renderXAxisDataLabels() {
    const vifAuthoring = this.props.vifAuthoring;
    const inputAttributes = {
      id: 'x-axis-data-labels',
      type: 'checkbox',
      onChange: this.props.onChangeXAxisDataLabels,
      defaultChecked: getXAxisDataLabels(vifAuthoring)
    };

    return (
      <div className="authoring-field-group">
        <h5>{translate('panes.axis_and_scale.subheaders.x_axis_data_labels')}</h5>
        <div className="authoring-field">
          <div className="checkbox">
            <input {...inputAttributes}/>
            <label className="inline-label" htmlFor="x-axis-data-labels">
              <span className="fake-checkbox">
                <span className="icon-checkmark3"></span>
              </span>
              {translate('panes.axis_and_scale.fields.x_axis_data_labels.title')}
            </label>
          </div>
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
    }

    return (
      <div className="authoring-field-group">
        <h5>{translate('panes.axis_and_scale.subheaders.chart_sorting')}</h5>
        <div className="authoring-field">
          <Styleguide.Dropdown {...attributes} />
        </div>
      </div>
    );
  },

  renderColumnChartControls() {
    const visualizationLabels = this.renderVisualizationLabels();
    const xAxisDataLabels = this.renderXAxisDataLabels();
    const chartSorting = this.renderChartSorting();

    return (
      <div>
        {visualizationLabels}
        {xAxisDataLabels}
        {chartSorting}
      </div>
    );
  },

  renderHistogramControls() {
    return this.renderVisualizationLabels();
  },

  renderTimelineChartControls() {
    return this.renderVisualizationLabels();
  },

  renderEmptyPane() {
    return <EmptyPane />;
  },

  render() {
    const vifAuthoring = this.props.vifAuthoring;

    let configuration;

    if (isColumnChart(vifAuthoring)) {
      configuration = this.renderColumnChartControls();
    } else if (isHistogram(vifAuthoring)) {
      configuration = this.renderHistogramControls();
    } else if (isTimelineChart(vifAuthoring)) {
      configuration = this.renderTimelineChartControls();
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
    onChangeLabelBottom: _.debounce(event => {
      const labelBottom = event.target.value;

      dispatch(setLabelBottom(labelBottom));
    }, INPUT_DEBOUNCE_MILLISECONDS),

    onChangeLabelLeft: _.debounce(event => {
      const labelLeft = event.target.value;

      dispatch(setLabelLeft(labelLeft));
    }, INPUT_DEBOUNCE_MILLISECONDS),

    onChangeXAxisDataLabels: (event) => {
      const xAxisDataLabels = event.target.checked;

      dispatch(setXAxisDataLabels(xAxisDataLabels));
    },

    onSelectChartSorting: (chartSorting) => {
      dispatch(setOrderBy(chartSorting.orderBy));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(AxisAndScalePane);
