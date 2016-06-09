import React from 'react';
import { connect } from 'react-redux';

import CustomizationTabPane from '../CustomizationTabPane';

import { translate } from '../I18n';
import { VISUALIZATION_TYPES, AGGREGATION_TYPES } from '../constants';
import { setDimension, setMeasure, setVisualizationType, setDataSource, setComputedColumn, setMeasureAggregation } from '../actions';
import { isLoading, hasData, hasError, getValidRegions, getValidMeasures, getValidDimensions } from '../selectors/metadata';
import { getCurrentVif, isFeatureMap, isChoroplethMap, getShapefileUid } from '../selectors/vifAuthoring';

export var DataPane = React.createClass({
  propTypes: {
    aggregationTypes: React.PropTypes.array,
    vif: React.PropTypes.object,
    vifAuthoring: React.PropTypes.object,
    metadata: React.PropTypes.object,
    defaultOptionKey: React.PropTypes.string,
    visualizationTypes: React.PropTypes.array,
    onChangeMeasure: React.PropTypes.func,
    onChangeMeasureAggregation: React.PropTypes.func,
    onChangeVisualizationType: React.PropTypes.func,
    onChangeRegion: React.PropTypes.func
  },

  getDefaultProps() {
    return {
      visualizationTypes: VISUALIZATION_TYPES,
      aggregationTypes: AGGREGATION_TYPES
    }
  },

  onChangeRegion(event) {
    var computedColumnUid = event.target.value;
    var regions = getValidRegions(this.props.metadata);
    var region = _.find(regions, {uid: computedColumnUid});

    this.props.onChangeRegion(computedColumnUid, region.fieldName);
  },

  dimensionDropdown() {
    var dimensions = getValidDimensions(this.props.metadata);
    var dimensionOptions = [
      <option key="" value="" disabled>{translate('panes.data.fields.dimension.placeholder')}</option>,
      ...dimensions.map(dimension => {
        return <option value={dimension.fieldName} key={dimension.fieldName}>{dimension.name}</option>;
      })
    ];

    return (
      <div className="dimension-dropdown-container">
        <label className="block-label" htmlFor="dimension-selection">{translate('panes.data.fields.dimension.title')}:</label>
        <select onChange={this.props.onChangeDimension} defaultValue="" id="dimension-selection">{dimensionOptions}</select>
      </div>
    );
  },

  measureDropdown() {
    var measures = getValidMeasures(this.props.metadata);
    var visualizationType = _.get(this.props.vif, 'series[0].type');
    var selectAttributes = {
      onChange: this.props.onChangeMeasure,
      defaultValue: '',
      id: 'measure-selection',
      disabled: isFeatureMap(this.props.vifAuthoring)
    };

    var measureOptions = [
      <option key="" value="">{translate('panes.data.fields.measure.no_value')}</option>,
      ...measures.map(measure => {
        return <option value={measure.fieldName} key={measure.fieldName}>{measure.name}</option>;
      })
    ];

    return (
      <div className="measure-dropdown-container">
        <label className="block-label" htmlFor="measure-selection">{translate('panes.data.fields.measure.title')}:</label>
        <select {...selectAttributes}>{measureOptions}</select>
      </div>
    );
  },

  measureAggregationDropdown() {
    var visualizationType = _.get(this.props.vif, 'series[0].type');
    var isFeatureMap = visualizationType === 'featureMap';
    var selectAttributes = {
      onChange: this.props.onChangeMeasureAggregation,
      defaultValue: 'count',
      id: 'measure-aggregation-selection',
      disabled: isFeatureMap
    };

    var measureAggregationOptions = [
      ..._.map(this.props.aggregationTypes, aggregationType => {
        return <option value={aggregationType.type} key={aggregationType.type}>{aggregationType.title}</option>;
      })
    ];

    return (
      <div className="measure-dropdown-container">
        <label className="block-label" htmlFor="measure-aggregation-selection">{translate('panes.data.fields.measure_aggregation.title')}:</label>
        <select {...selectAttributes}>{measureAggregationOptions}</select>
      </div>
    );
  },

  regionDropdown() {
    var metadata = this.props.metadata;
    var regions = getValidRegions(metadata);
    var defaultRegion = getShapefileUid(this.props.vifAuthoring);
    var regionOptions = [
      <option key="" value="" disabled>{translate('panes.data.fields.region.placeholder')}</option>,
      ...regions.map(region => {
        return <option value={region.uid} key={region.uid}>{region.name}</option>
      })
    ];

    return (
      <div className="region-dropdown-container">
        <label className="block-label" htmlFor="region-selection">{translate('panes.data.fields.region.title')}:</label>
        <select onChange={this.onChangeRegion} defaultValue={defaultRegion || ''} id="region-selection">{regionOptions}</select>
      </div>
    );
  },

  visualizationTypeDropdown() {
    var types = this.props.visualizationTypes;
    var selectedVisualizationType = _.get(
      this.props,
      'vifAuthoring.selectedVisualizationType',
      ''
    );

    var visualizationTypeOptions = [
      <option key="" value="" disabled>{translate('panes.data.fields.visualization_type.placeholder')}</option>,
      ...types.map(visualizationType => {
        return <option value={visualizationType.type} key={visualizationType.type}>{visualizationType.title}</option>;
      })
    ];

    return (
      <div className="visualization-type-dropdown-container">
        <label className="block-label" htmlFor="visualization-type-selection">{translate('panes.data.fields.visualization_type.title')}:</label>
        <select onChange={this.props.onChangeVisualizationType} defaultValue={selectedVisualizationType} id="visualization-type-selection">{visualizationTypeOptions}</select>
      </div>
    );
  },

  metadataLoading() {
    return (
      <div className="metadata-loading">
        <span className="spinner-default metadata-loading-spinner"></span> {translate('panes.data.loading_metadata')}
      </div>
    );
  },

  metadataError() {
    return (
      <div className="alert error">
        <strong>{translate('panes.data.uhoh')}</strong> {translate('panes.data.loading_metadata_error')}
      </div>
    );
  },

  render() {
    var metadataInfo;
    var regionsDropdown;
    var dimensionDropdown;
    var measureDropdown;
    var measureAggregationDropdown;
    var visualizationTypeDropdown;
    var metadata = this.props.metadata;
    var datasetUid = _.get(metadata, 'data.uid');

    if (hasError(metadata)) {
      metadataInfo = this.metadataError();
    } else if (isLoading(metadata)) {
      metadataInfo = this.metadataLoading();
    }

    if (hasData(metadata)) {
      dimensionDropdown = this.dimensionDropdown();
      measureDropdown = this.measureDropdown();
      measureAggregationDropdown = this.measureAggregationDropdown();
      visualizationTypeDropdown = this.visualizationTypeDropdown();

      if (isChoroplethMap(this.props.vifAuthoring)) {
        regionsDropdown = this.regionDropdown();
      }
    }

    return (
      <form>
        {metadataInfo}

        {visualizationTypeDropdown}
        {measureDropdown}
        {measureAggregationDropdown}
        {dimensionDropdown}

        {regionsDropdown}
      </form>
    );
  }
});

function mapStateToProps(state) {
  return {
    vifAuthoring: state.vifAuthoring,
    vif: getCurrentVif(state.vifAuthoring),
    metadata: state.metadata
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onChangeDimension: event => {
      var dimension = event.target.value;
      dispatch(setDimension(dimension));
    },

    onChangeMeasure: event => {
      var measure = event.target.value;
      dispatch(setMeasure(measure));
    },

    onChangeMeasureAggregation: event => {
      var measureAggregation = event.target.value;
      dispatch(setMeasureAggregation(measureAggregation));
    },

    onChangeVisualizationType: event => {
      var visualizationType = event.target.value;
      dispatch(setVisualizationType(visualizationType));
    },

    onChangeRegion: (computedColumnUid, computedColumnName) => {
      dispatch(setComputedColumn(computedColumnUid, computedColumnName));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(DataPane);
