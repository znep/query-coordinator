import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../I18n';
import { INPUT_DEBOUNCE_MILLISECONDS } from '../../constants';
import { setLabelBottom, setLabelLeft } from '../../actions';
import {
  getAxisLabels,
  isColumnChart,
  isHistogram,
  isTimelineChart
} from '../../selectors/vifAuthoring';

import CustomizationTabPane from '../CustomizationTabPane';
import EmptyPane from './EmptyPane';

export var AxisAndScalePane = React.createClass({

  renderVisualizationLabels() {
    var vifAuthoring = this.props.vifAuthoring;
    var axisLabels = getAxisLabels(vifAuthoring);
    var leftAxisLabel = _.get(axisLabels, 'left', null);
    var bottomAxisLabel = _.get(axisLabels, 'bottom', null);

    return (
      <div>
        <h5>{translate('panes.axis_and_scale.subheaders.labels')}</h5>
        <label className="block-label" htmlFor="label-left">{translate('panes.axis_and_scale.fields.left.title')}</label>
        <input className="text-input" id="label-left" type="text" onChange={this.props.onChangeLabelLeft} defaultValue={leftAxisLabel} />
        <label className="block-label" htmlFor="label-bottom">{translate('panes.axis_and_scale.fields.bottom.title')}</label>
        <input className="text-input" id="label-bottom" type="text" onChange={this.props.onChangeLabelBottom} defaultValue={bottomAxisLabel} />
      </div>
    );
  },

  renderColumnChartControls() {
    return this.renderVisualizationLabels();
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
    var configuration;
    var vifAuthoring = this.props.vifAuthoring;

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
      var labelBottom = event.target.value;
      dispatch(setLabelBottom(labelBottom));
    }, INPUT_DEBOUNCE_MILLISECONDS),

    onChangeLabelLeft: _.debounce(event => {
      var labelLeft = event.target.value;
      dispatch(setLabelLeft(labelLeft));
    }, INPUT_DEBOUNCE_MILLISECONDS)
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(AxisAndScalePane);
