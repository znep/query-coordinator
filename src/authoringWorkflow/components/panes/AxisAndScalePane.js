import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../I18n';
import { INPUT_DEBOUNCE_MILLISECONDS } from '../../constants';
import { setLabelBottom, setLabelLeft, setXAxisDataLabels } from '../../actions';
import {
  getAxisLabels,
  getXAxisDataLabels,
  isColumnChart,
  isHistogram,
  isTimelineChart
} from '../../selectors/vifAuthoring';

import CustomizationTabPane from '../CustomizationTabPane';
import EmptyPane from './EmptyPane';

export var AxisAndScalePane = React.createClass({

  renderVisualizationLabels() {
    const vifAuthoring = this.props.vifAuthoring;
    const axisLabels = getAxisLabels(vifAuthoring);
    const leftAxisLabel = _.get(axisLabels, 'left', null);
    const bottomAxisLabel = _.get(axisLabels, 'bottom', null);

    return (
      <div>
        <h5>{translate('panes.axis_and_scale.subheaders.axis_titles')}</h5>
        <label
          className="block-label"
          htmlFor="label-left">
          {translate('panes.axis_and_scale.fields.left_axis_title.title')}
        </label>
        <input
          className="text-input"
          id="label-left"
          type="text"
          onChange={this.props.onChangeLabelLeft}
          defaultValue={leftAxisLabel} />
        <label
          className="block-label"
          htmlFor="label-bottom">
          {translate('panes.axis_and_scale.fields.bottom_axis_title.title')}
        </label>
        <input
          className="text-input"
          id="label-bottom"
          type="text"
          onChange={this.props.onChangeLabelBottom}
          defaultValue={bottomAxisLabel} />
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
      <div>
        <h5>{translate('panes.axis_and_scale.subheaders.x_axis_data_labels')}</h5>
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
    );
  },

  renderColumnChartControls() {
    const visualizationLabels = this.renderVisualizationLabels();
    const xAxisDataLabels = this.renderXAxisDataLabels();

    return (
      <div>
        {visualizationLabels}
        {xAxisDataLabels}
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
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(AxisAndScalePane);
