import React from 'react';
import { connect } from 'react-redux';

import CustomizationTabPane from '../CustomizationTabPane';
import { setDimension, setMeasure, setChartType, setDataSource, setComputedColumn, setMeasureAggregation } from '../actions';
import { isLoading, hasData, hasError, getValidRegions, getValidMeasures, getValidDimensions } from '../selectors/datasetMetadata';
import { getCurrentVif, isChoroplethMap } from '../selectors/vifAuthoring';

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
        {type: 'choroplethMap', name: 'Choropleth Map'},
        {type: 'featureMap', name: 'Feature Map'},
        {type: 'timelineChart', name: 'Timeline Chart'}
      ],
      aggregationTypes: [
        {type: 'none', name: 'No Aggregation'},
        {type: 'count', name: 'Count'},
        {type: 'sum', name: 'Sum'}
      ]
    }
  },

  dimensionDropdown: function() {
    var defaultOptionKey = this.props.defaultOptionKey;
    var dimensions = getValidDimensions(this.props.datasetMetadata);

    var dimensionOptions = [
      <option key={defaultOptionKey} value={defaultOptionKey} disabled>Select a dimension...</option>,
      ...dimensions.map(dimension => {
        return <option value={dimension.fieldName} key={dimension.fieldName}>{dimension.name}</option>;
      })
    ];

    return <select onChange={this.props.onChangeDimension} defaultValue={defaultOptionKey} name="dimension-selection">{dimensionOptions}</select>;
  },

  measureDropdown: function() {
    var defaultOptionKey = this.props.defaultOptionKey;
    var measures = getValidMeasures(this.props.datasetMetadata);

    var chartType = _.get(this.props.vif, 'series[0].type');
    var isFeatureMap = chartType === 'featureMap';

    var selectAttributes = {
      onChange: this.props.onChangeMeasure,
      defaultValue: defaultOptionKey,
      name: "measure-selection",
      disabled: isFeatureMap
    };

    var measureOptions = [
      <option key={defaultOptionKey} value={defaultOptionKey} disabled>Select a measure...</option>,
      ...measures.map(measure => {
        return <option value={measure.fieldName} key={measure.fieldName}>{measure.name}</option>;
      })
    ];

    return <select {...selectAttributes}>{measureOptions}</select>;
  },

  measureAggregationDropdown: function() {
    var chartType = _.get(this.props.vif, 'series[0].type');
    var isFeatureMap = chartType === 'featureMap';
    var selectAttributes = {
      onChange: this.props.onChangeMeasureAggregation,
      name: "measure-selection",
      disabled: isFeatureMap
    };

    var measureAggregationOptions = _.map(this.props.aggregationTypes, aggregationType => {
      return <option value={aggregationType.type} key={aggregationType.type}>{aggregationType.name}</option>;
    });

    return <select {...selectAttributes}>{measureAggregationOptions}</select>;
  },

  regionsDropdown: function() {
    var datasetMetadata = this.props.datasetMetadata;
    var defaultOptionKey = this.props.defaultOptionKey;
    var regions = getValidRegions(datasetMetadata);

    var regionOptions = [
      <option key={defaultOptionKey} value={defaultOptionKey} disabled>Select a region...</option>,
      ...regions.map(region => {
        var value = `["${region.uid}", "${region.fieldName}"]`;
        return <option value={value} key={region.uid}>{region.name}</option>
      })
    ];

    return <select onChange={this.props.onChangeRegion} defaultValue={defaultOptionKey} name="region-selection">{regionOptions}</select>;
  },

  chartTypeDropdown: function() {
    var datasetMetadata = this.props.datasetMetadata;
    var types = this.props.chartTypes;
    var selectedVisualizationType = _.get(
      this.props,
      'vifAuthoring.selectedVisualizationType',
      this.props.defaultOptionKey
    );

    var chartTypeOptions = [
      <option key={this.props.defaultOptionKey} value={this.props.defaultOptionKey} disabled>Select a chart type...</option>,
      ...types.map(chartType => {
        return <option value={chartType.type} key={chartType.type}>{chartType.name}</option>;
      })
    ];

    return <select onChange={this.props.onChangeChartType} defaultValue={selectedVisualizationType} name="chart-type-selection">{chartTypeOptions}</select>;
  },

  render: function() {
    var datasetMetadataInfo;
    var regionsDropdown;
    var dimensionDropdown;
    var measureDropdown;
    var measureAggregationDropdown;
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
      measureAggregationDropdown = <div>Measure Aggregation: {this.measureAggregationDropdown()}</div>;
      chartTypeDropdown = <div>Chart Type: {this.chartTypeDropdown()}</div>;

      if (isChoroplethMap(this.props.vifAuthoring)) {
        regionsDropdown = <div>Region: {this.regionsDropdown()}</div>;
      }
    }

    return (
      <form>
        {datasetMetadataInfo}

        {dimensionDropdown}
        {measureDropdown}
        {measureAggregationDropdown}
        {chartTypeDropdown}

        {regionsDropdown}
      </form>
    );
  }
});

function mapStateToProps(state) {
  return {
    vifAuthoring: state.vifAuthoring,
    vif: getCurrentVif(state.vifAuthoring),
    datasetMetadata: state.datasetMetadata
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onChangeDimension: function(event) {
      var dimension = event.target.value;
      dispatch(setDimension(dimension));
    },

    onChangeMeasure: function(event) {
      var measure = event.target.value;
      dispatch(setMeasure(measure));
    },

    onChangeMeasureAggregation: function(event) {
      var measureAggregation = event.target.value;
      dispatch(setMeasureAggregation(measureAggregation));
    },

    onChangeChartType: function(event) {
      var chartType = event.target.value;
      dispatch(setChartType(chartType));
    },

    onChangeRegion: function(event) {
      var computedColumnMetadata = JSON.parse(event.target.value);
      dispatch(setComputedColumn(...computedColumnMetadata));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(DataPane);
