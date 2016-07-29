import _ from 'lodash';
import { connect } from 'react-redux';
import React, { PropTypes } from 'react';
import Styleguide from 'socrata-styleguide';

import { translate } from '../../I18n';
import { VISUALIZATION_TYPES } from '../constants';
import { setVisualizationType } from '../actions';
import { getAnyDimension, getSelectedVisualizationType } from '../selectors/vifAuthoring';
import {
  hasData,
  getRecommendedVisualizationTypes
} from '../selectors/metadata';

export var VisualizationTypeSelector = React.createClass({
  propTypes: {
    vifAuthoring: PropTypes.object,
    metadata: PropTypes.object,
    onSelectVisualizationType: PropTypes.func
  },

  getDefaultProps() {
    return {
      visualizationTypes: VISUALIZATION_TYPES
    }
  },

  renderVisualizationTypeSelector() {
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
        <label className="block-label" htmlFor="visualization-type-selection">{translate('panes.data.fields.visualization_type.title')}</label>
        <Styleguide.components.Dropdown {...visualizationTypesAttributes} />
      </div>
    );
  },

  render() {
    var { metadata } = this.props;

    return hasData(metadata) ?
      this.renderVisualizationTypeSelector() :
      null;
  }
});

function mapStateToProps(state) {
  var { vifAuthoring, metadata } = state;
  return { vifAuthoring, metadata };
}

function mapDispatchToProps(dispatch) {
  return {
    onSelectVisualizationType(visualizationType) {
      dispatch(setVisualizationType(visualizationType.value));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(VisualizationTypeSelector);
