import React from 'react';
import { connect } from 'react-redux';

import CustomizationTabPane from '../CustomizationTabPane';
import { setDimension, setMeasure, setChartType, setDatasetUid } from '../actions';
import { isLoading, hasData, hasError } from '../selectors/datasetMetadata';

export var DataPane = React.createClass({
  propTypes: {
    vif: React.PropTypes.object,
    datasetMetadata: React.PropTypes.object,
    defaultOptionKey: React.PropTypes.string,
    chartTypes: React.PropTypes.array,
    onChangeDatasetUid: React.PropTypes.func,
    onChangeDimension: React.PropTypes.func,
    onChangeMeasure: React.PropTypes.func,
    onChangeChartType: React.PropTypes.func
  },

  getDefaultProps: function() {
    return {
      defaultOptionKey: '__unselectable__',
      chartTypes: [
        {type: 'columnChart', name: 'Column Chart'},
        {type: 'timelineChart', name: 'Timeline Chart'}
      ]
    }
  },

  componentDidMount: function() {
    var datasetUid = _.get(this.props.vif, 'series[0].dataSource.datasetUid');

    if (datasetUid) {
      this.props.onChangeDatasetUid({target: {value: datasetUid}});
    }
  },

  dimensionDropdown: function() {
    var datasetMetadata = this.props.datasetMetadata;
    var columns = _.get(datasetMetadata, 'data.columns', []);
    var defaultOptionKey = this.props.defaultOptionKey;

    var dimensionOptions = [
      <option key={defaultOptionKey} value={defaultOptionKey} disabled>Select a dimension...</option>,
      ...columns.map(column => {
        return <option value={column.fieldName} key={column.fieldName}>{column.name}</option>;
      })
    ];

    return <select onChange={this.props.onChangeDimension} defaultValue={defaultOptionKey} name="dimension-selection">{dimensionOptions}</select>;
  },

  measureDropdown: function() {
    var datasetMetadata = this.props.datasetMetadata;
    var defaultOptionKey = this.props.defaultOptionKey;
    var columns = _.get(datasetMetadata, 'data.columns', []);
    var numberColumns = _.filter(columns, { dataTypeName: 'number' });

    var measureOptions = [
      <option key={defaultOptionKey} value={defaultOptionKey} disabled>Select a measure...</option>,
      ...numberColumns.map(numberColumn => {
        return <option value={numberColumn.fieldName} key={numberColumn.fieldName}>{numberColumn.name}</option>;
      })
    ];

    return <select onChange={this.props.onChangeMeasure} defaultValue={defaultOptionKey} name="measure-selection">{measureOptions}</select>;
  },

  chartTypeDropdown: function() {
    var datasetMetadata = this.props.datasetMetadata;
    var defaultOptionKey = this.props.defaultOptionKey;
    var types = this.props.chartTypes;

    var chartTypeOptions = [
      <option key={defaultOptionKey} value={defaultOptionKey} disabled>Select a chart type...</option>,
      ...types.map(chartType => {
        return <option value={chartType.type} key={chartType.type}>{chartType.name}</option>;
      })
    ];

    return <select onChange={this.props.onChangeChartType} defaultValue={defaultOptionKey} name="chart-type-selection">{chartTypeOptions}</select>;
  },

  render: function() {
    var datasetMetadataInfo;
    var dimensionDropdown;
    var measureDropdown;
    var chartTypeDropdown;
    var datasetMetadata = this.props.datasetMetadata;
    var datasetUid = _.get(this.props.vif, 'series[0].dataSource.datasetUid', null);

    if (hasError(datasetMetadata)) {
      datasetMetadataInfo = <div>Problem fetching dataset metadata</div>;
    } else if (isLoading(datasetMetadata)) {
      datasetMetadataInfo = <div>Loading dataset metadata</div>;
    }

    if (hasData(datasetMetadata)) {
      dimensionDropdown = <div>Dimension: {this.dimensionDropdown()}</div>;
      measureDropdown = <div>Measure: {this.measureDropdown()}</div>;
      chartTypeDropdown = <div>Chart Type: {this.chartTypeDropdown()}</div>;
    }

    return (
      <form>
        <label className="block-label">Enter a dataset four by four:</label>
        <input className="text-input" type="text" defaultValue={datasetUid} onChange={this.props.onChangeDatasetUid} />

        {datasetMetadataInfo}

        {dimensionDropdown}
        {measureDropdown}
        {chartTypeDropdown}
      </form>
    );
  }
});

function mapStateToProps(state) {
  return {
    vif: state.vif,
    datasetMetadata: state.datasetMetadata
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onChangeDatasetUid: function(event) {
      var datasetUid = event.target.value;
      dispatch(setDatasetUid(datasetUid));
    },

    onChangeDimension: function(event) {
      var dimension = event.target.value;
      dispatch(setDimension(dimension));
    },

    onChangeMeasure: function(event) {
      var measure = event.target.value;
      dispatch(setMeasure(measure));
    },

    onChangeChartType: function(event) {
      var chartType = event.target.value;
      dispatch(setChartType(chartType));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(DataPane);
