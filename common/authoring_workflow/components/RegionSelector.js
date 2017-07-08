import _ from 'lodash';
import { connect } from 'react-redux';
import React, { PropTypes } from 'react';
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
  isRegionMap
} from '../selectors/vifAuthoring';

import {
  getValidComputedColumns,
  getValidCuratedRegions,
  getValidRegions,
  hasData,
  hasRegions
} from '../selectors/metadata';

export var RegionSelector = React.createClass({
  propTypes: {
    vifAuthoring: PropTypes.object,
    metadata: PropTypes.object,
    onSelectRegion: PropTypes.func
  },

  onSelectRegion({computedColumn, curatedRegion, domain}) {
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
  },

  renderRegionProcessingMessage() {
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
          <p className="region-processing-info-last-checked"><span className="spinner-default"/> {lastCheckedMessage}</p>
        </div>
      );
    }
  },

  renderRegionProcessingError() {
    var { regionCodingError } = this.props.vifAuthoring.authoring;

    if (regionCodingError) {
      return (
        <div className="region-processing-error alert error">
          <p>Oh no!<br/>There was an error trying to process your region selection.</p>
        </div>
      );
    }
  },

  renderSelector() {
    var { metadata, vifAuthoring } = this.props;
    var reference = (ref) => { this.selector = ref; };
    var domain = getDomain(vifAuthoring);
    var defaultRegion = getShapefileUid(vifAuthoring);

    var computedColumns = _.map(getValidComputedColumns(metadata), (computedColumn) => {
      return {
        title: computedColumn.name,
        value: computedColumn.uid,
        group: I18n.t('shared.visualizations.panes.data.fields.region.groups.ready_to_use'),
        computedColumn,
        domain
      };
    });

    var curatedRegions = _.map(getValidCuratedRegions(metadata), (curatedRegion) => {
      return {
        title: curatedRegion.name,
        value: curatedRegion.uid,
        group: I18n.t('shared.visualizations.panes.data.fields.region.groups.requires_processing'),
        curatedRegion
      };
    });

    var regionAttributes = {
      id: 'region-selection',
      placeholder: I18n.t('shared.visualizations.panes.data.fields.region.placeholder'),
      options: [ ...computedColumns, ...curatedRegions ],
      value: defaultRegion,
      onSelection: this.onSelectRegion,
      disabled: !hasRegions(metadata)
    };

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
  },

  render() {
    var { metadata, vifAuthoring } = this.props;
    var canRender = hasData(metadata) &&
      isRegionMap(vifAuthoring) &&
      _.isString(getDimension(vifAuthoring).columnName);

    return canRender ?
      this.renderSelector() :
      null;
  }
});


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
