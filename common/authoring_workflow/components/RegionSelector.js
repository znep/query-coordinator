import _ from 'lodash';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Dropdown } from 'common/components';
import I18n from 'common/i18n';

import BlockLabel from './shared/BlockLabel';

import {
  initiateRegionCoding,
  requestShapefileMetadata,
  setComputedColumn
} from '../actions';

import {
  getDatasetUid,
  getDimension,
  getDomain,
  getShapefileUid,
  isRegionMap,
  getPointAggregation,
  getSelectedVisualizationType
} from '../selectors/vifAuthoring';

import {
  getValidComputedColumns,
  getValidCuratedRegions,
  getValidRegions,
  hasData,
  hasRegions,
  isPointMapColumn
} from '../selectors/metadata';
import { FeatureFlags } from 'common/feature_flags';

export class RegionSelector extends Component {
  onSelectRegion = ({ computedColumn, curatedRegion, domain }) => {
    var {
      vifAuthoring,
      onSelectComputedColumn,
      onSelectCuratedRegion,
      onSelectComputedColumnShapefile
    } = this.props;

    if (computedColumn) {
      onSelectComputedColumn(computedColumn);
      onSelectComputedColumnShapefile(domain, computedColumn.uid);
    } else if (curatedRegion) {
      onSelectCuratedRegion(
        getDomain(vifAuthoring),
        getDatasetUid(vifAuthoring),
        getDimension(vifAuthoring).columnName,
        curatedRegion
      );
    }
  }

  renderRegionProcessingMessage = () => {
    var {
      showRegionCodingProcessingMessage,
      regionCodingLastChecked
    } = this.props.vifAuthoring.authoring;

    var lastCheckedMessage = I18n.t('shared.visualizations.panes.data.fields.region.last_checked');

    lastCheckedMessage += regionCodingLastChecked ?
      ` ${regionCodingLastChecked}` :
      ` ${I18n.t('shared.visualizations.panes.data.fields.region.never')}`;

    if (showRegionCodingProcessingMessage) {
      return (
        <div className="region-processing-info alert warning">
          <p>{I18n.t('shared.visualizations.panes.data.fields.region.selected_region_processing')}</p>
          <p>{I18n.t('shared.visualizations.panes.data.fields.region.region_coding_duration')}</p>
          <p>{I18n.t('shared.visualizations.panes.data.fields.region.stay_or_return_later')}</p>
          <p className="region-processing-info-last-checked"><span className="spinner-default" /> {lastCheckedMessage}</p>
        </div>
      );
    }
  }

  renderRegionProcessingError = () => {
    var { regionCodingError } = this.props.vifAuthoring.authoring;

    if (regionCodingError) {
      return (
        <div className="region-processing-error alert error">
          <p>Oh no!<br />There was an error trying to process your region selection.</p>
        </div>
      );
    }
  }

  renderSelector = () => {
    const { metadata, vifAuthoring } = this.props;
    const dimension = getDimension(vifAuthoring);
    const reference = (ref) => { this.selector = ref; };
    const domain = getDomain(vifAuthoring);
    const defaultRegion = getShapefileUid(vifAuthoring);
    const computedColumns = _.map(getValidComputedColumns(metadata), (computedColumn) => {
      return {
        title: computedColumn.name,
        value: computedColumn.uid,
        group: I18n.t('shared.visualizations.panes.data.fields.region.groups.ready_to_use'),
        computedColumn,
        domain
      };
    });
    const curatedRegions = _.map(getValidCuratedRegions(metadata), (curatedRegion) => {
      return {
        title: curatedRegion.name,
        value: curatedRegion.uid,
        group: I18n.t('shared.visualizations.panes.data.fields.region.groups.requires_processing'),
        curatedRegion
      };
    });

    let disabled = !hasRegions(metadata);
    let placeholder = I18n.t('shared.visualizations.panes.data.fields.region.placeholder');
    const isNewGLMapEnabled = FeatureFlags.value('enable_new_maps');

    if (isNewGLMapEnabled) {
      disabled = disabled ||
        isPointMapColumn(metadata, dimension) ||
        getPointAggregation(vifAuthoring) !== 'region_map';
      placeholder = I18n.t('shared.visualizations.panes.data.fields.region_map.placeholder');
    }

    const regionAttributes = {
      disabled,
      id: 'region-selection',
      options: [...computedColumns, ...curatedRegions],
      placeholder,
      value: defaultRegion,
      onSelection: this.onSelectRegion
    };

    if (isNewGLMapEnabled && getSelectedVisualizationType(vifAuthoring) === 'map') {
      return (
        <div className="region-selector-container" ref={reference}>
          <Dropdown {...regionAttributes} />
          {this.renderRegionProcessingMessage()}
          {this.renderRegionProcessingError()}
        </div>
      );
    }

    return (
      <div className="region-selector-container" ref={reference}>
        <BlockLabel
          htmlFor="region-selection"
          title={I18n.t('shared.visualizations.panes.data.fields.region.title')}
          description={I18n.t('shared.visualizations.panes.data.fields.region.region_processing')} />
        <Dropdown {...regionAttributes} />
        {this.renderRegionProcessingMessage()}
        {this.renderRegionProcessingError()}
      </div>
    );
  }

  render() {
    const { metadata, vifAuthoring } = this.props;
    const dimension = getDimension(vifAuthoring);
    const canRender = hasData(metadata) &&
      (isRegionMap(vifAuthoring) || isPointMapColumn(metadata, dimension)) &&
      _.isString(dimension.columnName);

    return canRender ?
      this.renderSelector() :
      null;
  }
}

RegionSelector.propTypes = {
  vifAuthoring: PropTypes.object,
  metadata: PropTypes.object,
  onSelectRegion: PropTypes.func
};


function mapStateToProps(state) {
  var { vifAuthoring, metadata } = state;
  return { vifAuthoring, metadata };
}

function mapDispatchToProps(dispatch) {
  return {
    onSelectComputedColumnShapefile(domain, shapefileUid) {
      dispatch(requestShapefileMetadata(domain, shapefileUid));
    },

    onSelectComputedColumn(computedColumn) {
      dispatch(setComputedColumn(computedColumn.fieldName));
    },

    onSelectCuratedRegion(domain, datasetUid, sourceColumn, curatedRegion) {
      dispatch(initiateRegionCoding(domain, datasetUid, sourceColumn, curatedRegion));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(RegionSelector);
