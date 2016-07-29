import _ from 'lodash';
import React from 'react';
import classNames from 'classnames';
import { connect } from 'react-redux';
import Styleguide from 'socrata-styleguide';

import DimensionSelector from '../DimensionSelector';
import MeasureSelector from '../MeasureSelector';
import VisualizationTypeSelector from '../VisualizationTypeSelector';
import RegionSelector from '../RegionSelector';

import { translate } from '../../I18n';

import {
  isLoading,
  hasError
} from '../selectors/metadata';

export var DataPane = React.createClass({
  propTypes: {
    metadata: React.PropTypes.object
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
    var { metadata } = this.props;

    if (hasError(metadata)) {
      metadataInfo = this.metadataError();
    } else if (isLoading(metadata)) {
      metadataInfo = this.metadataLoading();
    }

    return (
      <form>
        {metadataInfo}

        <DimensionSelector />
        <MeasureSelector />
        <VisualizationTypeSelector />
        <RegionSelector />
      </form>
    );
  }
});

function mapStateToProps(state) {
  var { metadata } = state;

  return {
    metadata
  };
}

export default connect(mapStateToProps, {})(DataPane);
