import _ from 'lodash';
import { connect } from 'react-redux';
import React, { PropTypes } from 'react';
import Styleguide from 'socrata-styleguide';

import { translate } from '../../I18n';

import { setComputedColumn, initiateRegionCoding } from '../actions';
import {
  isChoroplethMap,
  getDimension,
  getShapefileUid,
  getDomain,
  getDatasetUid
} from '../selectors/vifAuthoring';

import {
  getValidRegions,
  getValidComputedColumns,
  getValidCuratedRegions
} from '../selectors/metadata';

export var RegionSelector = React.createClass({
  propTypes: {
    vifAuthoring: PropTypes.object,
    metadata: PropTypes.object,
    onSelectRegion: PropTypes.func
  },

  componentDidUpdate() {
    if (this.selector) {
      Styleguide.attachTo(this.selector);
    }
  },

  onSelectRegion({computedColumn, curatedRegion}) {
    var {
      vifAuthoring,
      onSelectComputedColumn,
      onSelectCuratedRegion
    } = this.props;

    if (computedColumn) {
      onSelectComputedColumn(computedColumn);
    } else if (curatedRegion) {
      onSelectCuratedRegion(
        getDomain(vifAuthoring),
        getDatasetUid(vifAuthoring),
        getDimension(vifAuthoring).columnName,
        curatedRegion
      );
    }
  },

  renderRegionInfo() {
    return (
      <div id="region-info-flyout" className="region-general-info flyout flyout-hidden">
        <section className="flyout-content">
          {translate('panes.data.fields.region.region_processing')}
        </section>
      </div>
    );
  },

  renderRegionProcessingMessage() {
    var { showRegionCodingProcessingMessage } = this.props.vifAuthoring.authoring;

    if (showRegionCodingProcessingMessage) {
      return (
        <div className="region-processing-info alert warning">
          <p>The selected region is currently being processed and geocoded.</p>
          <p>You can apply this region to your visualization, but it will not be viewable until processing is completed.</p>
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
    var defaultRegion = getShapefileUid(vifAuthoring);

    var computedColumns = _.map(getValidComputedColumns(metadata), (computedColumn) => {
      return {
        title: computedColumn.name,
        value: computedColumn.uid,
        group: translate('panes.data.fields.region.groups.ready_to_use'),
        computedColumn
      };
    });

    var curatedRegions = _.map(getValidCuratedRegions(metadata), (curatedRegion) => {
      return {
        title: curatedRegion.name,
        value: curatedRegion.uid,
        group: translate('panes.data.fields.region.groups.requires_processing'),
        curatedRegion
      };
    });

    var regionAttributes = {
      id: 'region-selection',
      placeholder: translate('panes.data.fields.region.placeholder'),
      options: [ ...computedColumns, ...curatedRegions ],
      value: defaultRegion,
      onSelection: this.onSelectRegion
    };

    return (
      <div className="region-dropdown-container" ref={reference}>
        <label className="block-label" htmlFor="region-selection">
          {translate('panes.data.fields.region.title')}
          <span className="icon-question" data-flyout="region-info-flyout"></span>:
        </label>
        {this.renderRegionInfo()}
        <Styleguide.components.Dropdown {...regionAttributes} />
        {this.renderRegionProcessingMessage()}
        {this.renderRegionProcessingError()}
      </div>
    );
  },

  render() {
    var { vifAuthoring } = this.props;

    return isChoroplethMap(vifAuthoring) && getDimension(vifAuthoring).columnName ?
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
