import _ from 'lodash';
import React from 'react';
import classNames from 'classnames';
import { connect } from 'react-redux';
import Styleguide from 'socrata-styleguide';

import CustomizationTabPane from '../CustomizationTabPane';

import { translate } from '../../I18n';
import { VISUALIZATION_TYPES, AGGREGATION_TYPES } from '../constants';

import {
  setDimension,
  setMeasure,
  setVisualizationType,
  setDataSource,
  setComputedColumn,
  setMeasureAggregation,
  initiateRegionCoding
} from '../actions';

import {
  isLoading,
  hasData,
  hasError,
  getValidRegions,
  getValidComputedColumns,
  getValidCuratedRegions,
  getValidMeasures,
  getValidDimensions,
  getRecommendedDimensions,
  getRecommendedVisualizationTypes
} from '../selectors/metadata';

import {
  getCurrentVif,
  isFeatureMap,
  isChoroplethMap,
  getShapefileUid,
  getVisualizationType,
  getSelectedVisualizationType,
  getAnyDimension,
  getAnyMeasure,
  getDatasetUid,
  getDimension,
  getDomain,
} from '../selectors/vifAuthoring';

export var DataPane = React.createClass({
  propTypes: {
    aggregationTypes: React.PropTypes.array,
    vif: React.PropTypes.object,
    vifAuthoring: React.PropTypes.object,
    metadata: React.PropTypes.object,
    defaultOptionKey: React.PropTypes.string,
    visualizationTypes: React.PropTypes.array,
    onSelectMeasure: React.PropTypes.func,
    onSelectMeasureAggregation: React.PropTypes.func,
    onSelectVisualizationType: React.PropTypes.func,
    onSelectRegion: React.PropTypes.func
  },

  getInitialState() {
    return {
      showRegionCodingInfo: false
    };
  },

  getDefaultProps() {
    return {
      visualizationTypes: VISUALIZATION_TYPES,
      aggregationTypes: AGGREGATION_TYPES
    }
  },

  onSelectRegion(selection) {
    var {
      metadata,
      vifAuthoring,
      onSelectRegion,
      onSelectCuratedRegion
    } = this.props;

    var computedColumnUid = selection.value;
    var regions = getValidRegions(metadata);
    var region = _.find(regions, {uid: computedColumnUid});

    if (region.fieldName) {
      onSelectRegion(computedColumnUid, region.fieldName);
    } else {
      onSelectCuratedRegion(
        getDomain(vifAuthoring),
        getDatasetUid(vifAuthoring),
        computedColumnUid,
        getDimension(vifAuthoring)
      );
    }
  },

  onClickRegionInfo() {
    this.setState({
      showRegionCodingInfo: !this.state.showRegionCodingInfo
    });
  },

  dimensionDropdown() {
    var { metadata, onSelectDimension, vifAuthoring } = this.props;
    var dimension = getAnyDimension(vifAuthoring);
    var type = getVisualizationType(vifAuthoring);

    var buildOption = group => {
      return dimension => ({
        title: dimension.name,
        value: dimension.fieldName,
        group
      });
    };

    var toRenderableRecommendedOption = buildOption(translate('panes.data.fields.dimension.groups.recommended_columns'));
    var toRenderableOption = buildOption(translate('panes.data.fields.dimension.groups.all_columns'));

    var dimensions = [
      ..._.map(getRecommendedDimensions(metadata, type), toRenderableRecommendedOption),
      ..._.map(getValidDimensions(metadata), toRenderableOption)
    ];

    var dimensionAttributes = {
      id: 'dimension-selection',
      options: dimensions,
      onSelection: onSelectDimension,
      placeholder: translate('panes.data.fields.dimension.placeholder'),
      value: dimension.columnName
    };

    return (
      <div className="dimension-dropdown-container">
        <label className="block-label" htmlFor="dimension-selection">{translate('panes.data.fields.dimension.title')}:</label>
        <Styleguide.components.Dropdown {...dimensionAttributes} />
      </div>
    );
  },

  measureDropdown() {
    var {
      metadata,
      vif,
      onSelectMeasure,
      vifAuthoring
    } = this.props;
    var measure = getAnyMeasure(vifAuthoring);
    var isCountingRows = _.isNull(measure.columnName);
    var measures = getValidMeasures(metadata);
    var visualizationType = _.get(vif, 'series[0].type');

    var classes = classNames('measure-dropdown-container', {
      'measure-dropdown-container-count-rows': isCountingRows
    });

    var options = [
      {title: translate('panes.data.fields.measure.no_value'), value: null},
      ...measures.map(measure => ({title: measure.name, value: measure.fieldName}))
    ];

    var measureAttributes = {
      id: 'measure-selection',
      options,
      onSelection: onSelectMeasure,
      disabled: isFeatureMap(vifAuthoring),
      value: measure.columnName
    };

    return (
      <div>
        <label className="block-label" htmlFor="measure-selection">{translate('panes.data.fields.measure.title')}:</label>
        <div className={classes}>
          <Styleguide.components.Dropdown {...measureAttributes} />
          {this.measureAggregationDropdown()}
        </div>
      </div>
    );
  },

  measureAggregationDropdown() {
    var {
      aggregationTypes,
      onSelectMeasureAggregation,
      vifAuthoring
    } = this.props;

    var measure = getAnyMeasure(vifAuthoring);
    var isNotCountingRows = !_.isNull(measure.columnName);

    if (isNotCountingRows) {
      var options = [
        {title: translate('aggregations.none'), value: null},
        ...aggregationTypes.map(aggregationType => ({title: aggregationType.title, value: aggregationType.type}))
      ];

      var measureAggregationAttributes = {
        options,
        onSelection: onSelectMeasureAggregation,
        value: measure.aggregationFunction,
        id: 'measure-aggregation-selection',
        disabled: isFeatureMap(vifAuthoring)
      };

      return <Styleguide.components.Dropdown {...measureAggregationAttributes} />;
    }
  },

  regionInfo() {
    var { showRegionCodingInfo } = this.state;
    var classes = classNames('region-general-info alert info', {
      'hidden': !showRegionCodingInfo
    });

    return (
      <div className={classes}>
        <p>There are two types of regions:</p>
        <ul>
          <li><em>Processed Region</em>: A previously processed region that renders instantly for this dataset.</li>
          <li><em>Unprocessed Region</em>: An unprocessed region that will be processed at demand.</li>
        </ul>
      </div>
    );
  },

  regionProcessing() {
    var { showRegionCodingProcessingMessage } = this.props.vifAuthoring.authoring;

    if (showRegionCodingProcessingMessage) {
      return (
        <div className="region-processing-info alert warning">
          <p>The selected column is currently being processed and region coded.</p>
          <p>An unprocessed region can still be applied to your visualization but will not be viewable until processing is complete.</p>
        </div>
      );
    }
  },

  regionProcessingError() {
    var { regionCodingError } = this.props.vifAuthoring.authoring;

    if (regionCodingError) {
      return (
        <div className="region-processing-error alert error">
          <p>Oh no! There was an error trying to process your region selection.</p>
        </div>
      );
    }
  },

  regionDropdown() {
    var metadata = this.props.metadata;
    var defaultRegion = getShapefileUid(this.props.vifAuthoring);

    var buildOption = group => {
      return (region) => ({title: region.name, value: region.uid, group});
    };

    var toComputedColumnOption = buildOption(translate('panes.data.fields.region.groups.processed_regions'));
    var toCuratedRegionOption = buildOption(translate('panes.data.fields.region.groups.unprocessed_regions'));

    var options = [
      ..._.map(getValidComputedColumns(metadata), toComputedColumnOption),
      ..._.map(getValidCuratedRegions(metadata), toCuratedRegionOption)
    ];

    var regionAttributes = {
      id: 'region-selection',
      placeholder: translate('panes.data.fields.region.placeholder'),
      options,
      value: defaultRegion,
      onSelection: this.onSelectRegion
    };

    return (
      <div className="region-dropdown-container">
        <label className="block-label" htmlFor="region-selection">
          {translate('panes.data.fields.region.title')}
          <span className="icon-question" onClick={this.onClickRegionInfo}></span>:
        </label>
        {this.regionInfo()}
        <Styleguide.components.Dropdown {...regionAttributes} />
        {this.regionProcessing()}
        {this.regionProcessingError()}
      </div>
    );
  },

  visualizationTypeDropdown() {
    var { visualizationTypes, vifAuthoring, metadata, onSelectVisualizationType } = this.props;
    var types = visualizationTypes;
    var selectedVisualizationType = getSelectedVisualizationType(vifAuthoring);
    var buildOption = group => {
      return visualizationType => ({
        title: visualizationType.title,
        value: visualizationType.type,
        group
      });
    };

    var toRenderableRecommendedOption = buildOption(translate('panes.data.fields.visualization_type.groups.recommended_visualizations'));
    var toRenderableOption = buildOption(translate('panes.data.fields.visualization_type.groups.all_visualizations'));

    var visualizationTypes = [
      ..._.map(getRecommendedVisualizationTypes(metadata, getAnyDimension(vifAuthoring)), toRenderableRecommendedOption),
      ..._.map(types, toRenderableOption)
    ];

    var visualizationTypesAttributes = {
      id: 'visualization-type-selection',
      options: visualizationTypes,
      placeholder: translate('panes.data.fields.visualization_type.placeholder'),
      value: selectedVisualizationType,
      onSelection: onSelectVisualizationType
    };

    return (
      <div className="visualization-type-dropdown-container">
        <label className="block-label" htmlFor="visualization-type-selection">{translate('panes.data.fields.visualization_type.title')}:</label>
        <Styleguide.components.Dropdown {...visualizationTypesAttributes} />
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
    var regionDropdown;
    var dimensionDropdown;
    var measureDropdown;
    var visualizationTypeDropdown;
    var { metadata, vifAuthoring } = this.props;
    var datasetUid = _.get(metadata, 'data.uid');

    if (hasError(metadata)) {
      metadataInfo = this.metadataError();
    } else if (isLoading(metadata)) {
      metadataInfo = this.metadataLoading();
    }

    if (hasData(metadata)) {
      dimensionDropdown = this.dimensionDropdown();
      measureDropdown = this.measureDropdown();
      visualizationTypeDropdown = this.visualizationTypeDropdown();

      if (isChoroplethMap(vifAuthoring) && getDimension(vifAuthoring).columnName) {
        regionDropdown = this.regionDropdown();
      }
    }

    return (
      <form ref={(ref) => { this.container = ref; }}>
        {metadataInfo}

        {visualizationTypeDropdown}
        {measureDropdown}
        {dimensionDropdown}

        {regionDropdown}
      </form>
    );
  }
});

function mapStateToProps(state) {
  var { vifAuthoring, metadata } = state;

  return {
    vifAuthoring,
    metadata,
    vif: getCurrentVif(vifAuthoring)
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onSelectDimension(dimension) {
      dispatch(setDimension(dimension.value));
    },

    onSelectMeasure(measure) {
      dispatch(setMeasure(measure.value));
    },

    onSelectMeasureAggregation(measureAggregation) {
      dispatch(setMeasureAggregation(measureAggregation.value));
    },

    onSelectVisualizationType(visualizationType) {
      dispatch(setVisualizationType(visualizationType.value));
    },

    onSelectRegion(computedColumnUid, computedColumnName) {
      dispatch(setComputedColumn(computedColumnUid, computedColumnName));
    },

    onSelectCuratedRegion(domain, datasetUid, shapefileId, sourceColumn) {
      dispatch(initiateRegionCoding(domain, datasetUid, shapefileId, sourceColumn));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(DataPane);
