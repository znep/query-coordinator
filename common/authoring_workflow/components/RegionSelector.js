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
  isNewGLMap,
  isRegionMap,
  getPointAggregation
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

const scope = 'shared.visualizations.panes.data.fields';

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

    var lastCheckedMessage = I18n.t('region.last_checked', { scope });

    lastCheckedMessage += regionCodingLastChecked ?
      ` ${regionCodingLastChecked}` :
      ` ${I18n.t('region.never', { scope })}`;

    if (showRegionCodingProcessingMessage) {
      return (
        <div className="region-processing-info alert warning">
          <p>{I18n.t('region.selected_region_processing', { scope })}</p>
          <p>{I18n.t('region.region_coding_duration', { scope })}</p>
          <p>{I18n.t('region.stay_or_return_later', { scope })}</p>
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
        group: I18n.t('region.groups.ready_to_use', { scope }),
        computedColumn,
        domain
      };
    });
    const curatedRegions = _.map(getValidCuratedRegions(metadata), (curatedRegion) => {
      return {
        title: curatedRegion.name,
        value: curatedRegion.uid,
        group: I18n.t('region.groups.requires_processing', { scope }),
        curatedRegion
      };
    });

    let disabled = !hasRegions(metadata);
    let placeholder = I18n.t('region.placeholder', { scope });
    const isNewGLMapEnabled = FeatureFlags.value('enable_new_maps') && isNewGLMap(vifAuthoring);

    if (isNewGLMapEnabled) {
      disabled = disabled || getPointAggregation(vifAuthoring) !== 'region_map';
      placeholder = I18n.t('region_map.placeholder', { scope });
    }

    const regionAttributes = {
      disabled,
      id: 'region-selection',
      options: [...computedColumns, ...curatedRegions],
      placeholder,
      value: defaultRegion,
      onSelection: this.onSelectRegion
    };
    const sectionTitle = isNewGLMapEnabled ?
      null :
      <BlockLabel
        htmlFor="region-selection"
        title={I18n.t('region.title', { scope })}
        description={I18n.t('region.region_processing', { scope })} />;

    return (
      <div className="region-selector-container" ref={reference}>
        {sectionTitle}
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
