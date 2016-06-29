import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../I18n';
import { INPUT_DEBOUNCE_MILLISECONDS } from '../constants';
import { isColumnChart, isTimelineChart } from '../selectors/vifAuthoring';
import CustomizationTabPane from '../CustomizationTabPane';
import { setLabelTop, setLabelBottom, setLabelLeft, setLabelRight } from '../actions';

export var AxisAndScalePane = React.createClass({

  visualizationLabels() {
    return (
      <div>
        <h5>Labels</h5>
        <label className="block-label" htmlFor="label-top">Top</label>
        <input className="text-input" id="label-top" type="text" onChange={this.props.onChangeLabelTop} />
        <label className="block-label" htmlFor="label-bottom">Bottom</label>
        <input className="text-input" id="label-bottom" type="text" onChange={this.props.onChangeLabelBottom} />
        <label className="block-label" htmlFor="label-left">Left</label>
        <input className="text-input" id="label-left" type="text" onChange={this.props.onChangeLabelLeft} />
        <label className="block-label" htmlFor="label-right">Right</label>
        <input className="text-input" id="label-right" type="text" onChange={this.props.onChangeLabelRight} />
      </div>
    );
  },

  columnChart() {
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
