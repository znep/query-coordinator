import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../I18n';
import { isLoading, hasData, hasError } from '../../selectors/metadata';

import VisualizationTypeSelector from '../VisualizationTypeSelector';
import DimensionSelector from '../DimensionSelector';
import MeasureSelector from '../MeasureSelector';
import RegionSelector from '../RegionSelector';

export var DataPane = React.createClass({
  propTypes: {
    metadata: React.PropTypes.object
  },

  renderMetadataLoading() {
    return (
      <div className="metadata-loading">
        <span className="spinner-default metadata-loading-spinner"></span> {translate('panes.data.loading_metadata')}
      </div>
    );
  },

  renderMetadataError() {
    return (
      <div className="metadata-error alert error">
        <strong>{translate('panes.data.uhoh')}</strong> {translate('panes.data.loading_metadata_error')}
      </div>
    );
  },

  render() {
    var metadataInfo;
    var { metadata } = this.props;

    if (hasError(metadata)) {
      metadataInfo = this.renderMetadataError();
    } else if (isLoading(metadata)) {
      metadataInfo = this.renderMetadataLoading();
    }

    return (
      <form>
        {metadataInfo}
        <VisualizationTypeSelector/>
        <MeasureSelector/>
        <DimensionSelector/>
        <RegionSelector/>
      </form>
    );
  }
});

function mapStateToProps(state) {
  return { metadata: state.metadata };
}

export default connect(mapStateToProps, {})(DataPane);
