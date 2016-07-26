import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../I18n';
import { INPUT_DEBOUNCE_MILLISECONDS } from '../constants';
import {
  getAxisLabels,
  isColumnChart,
  isHistogram,
  isTimelineChart
} from '../selectors/vifAuthoring';
import CustomizationTabPane from '../CustomizationTabPane';
import { setLabelTop, setLabelBottom, setLabelLeft, setLabelRight } from '../actions';

export var AxisAndScalePane = React.createClass({

  visualizationLabels() {
    var vifAuthoring = this.props.vifAuthoring;
    var axisLabels = getAxisLabels(vifAuthoring);
    var topAxisLabel = _.get(axisLabels, 'top', null);
    var rightAxisLabel = _.get(axisLabels, 'right', null);
    var bottomAxisLabel = _.get(axisLabels, 'bottom', null);
    var leftAxisLabel = _.get(axisLabels, 'left', null);

    return (
      <div>
        <h5>{translate('panes.axis_and_scale.subheaders.labels')}</h5>
        <label className="block-label" htmlFor="label-top">{translate('panes.axis_and_scale.fields.top.title')}</label>
        <input className="text-input" id="label-top" type="text" onChange={this.props.onChangeLabelTop} defaultValue={topAxisLabel} />
        <label className="block-label" htmlFor="label-bottom">{translate('panes.axis_and_scale.fields.bottom.title')}</label>
        <input className="text-input" id="label-bottom" type="text" onChange={this.props.onChangeLabelBottom} defaultValue={bottomAxisLabel} />
        <label className="block-label" htmlFor="label-left">{translate('panes.axis_and_scale.fields.left.title')}</label>
        <input className="text-input" id="label-left" type="text" onChange={this.props.onChangeLabelLeft} defaultValue={leftAxisLabel} />
        <label className="block-label" htmlFor="label-right">{translate('panes.axis_and_scale.fields.right.title')}</label>
        <input className="text-input" id="label-right" type="text" onChange={this.props.onChangeLabelRight} defaultValue={rightAxisLabel} />
      </div>
    );
  },

  columnChart() {
    return this.visualizationLabels();
  },

  histogram() {
    return this.visualizationLabels();
  },

  timelineChart() {
    return this.visualizationLabels();
  },

  render() {
    var configuration;
    var vifAuthoring = this.props.vifAuthoring;

    if (isColumnChart(vifAuthoring)) {
      configuration = this.columnChart();
    } else if (isHistogram(vifAuthoring)) {
      configuration = this.histogram();
    } else if (isTimelineChart(vifAuthoring)) {
      configuration = this.timelineChart();
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
      var labelTop = event.target.value;
      dispatch(setLabelTop(labelTop));
    }, INPUT_DEBOUNCE_MILLISECONDS),

    onChangeLabelBottom: _.debounce(event => {
      var labelBottom = event.target.value;
      dispatch(setLabelBottom(labelBottom));
    }, INPUT_DEBOUNCE_MILLISECONDS),

    onChangeLabelLeft: _.debounce(event => {
      var labelLeft = event.target.value;
      dispatch(setLabelLeft(labelLeft));
    }, INPUT_DEBOUNCE_MILLISECONDS),

    onChangeLabelRight: _.debounce(event => {
      var labelRight = event.target.value;
      dispatch(setLabelRight(labelRight));
    }, INPUT_DEBOUNCE_MILLISECONDS)
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(AxisAndScalePane);
