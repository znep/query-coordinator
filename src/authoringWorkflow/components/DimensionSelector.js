import _ from 'lodash';
import { connect } from 'react-redux';
import React, { PropTypes } from 'react';
import Styleguide from 'socrata-styleguide';

import { translate } from '../../I18n';
import { setDimension } from '../actions';
import { getAnyDimension, getVisualizationType } from '../selectors/vifAuthoring';
import { hasData, getRecommendedDimensions, getValidDimensions } from '../selectors/metadata';

export var DimensionSelector = React.createClass({
  propTypes: {
    vifAuthoring: PropTypes.object,
    metadata: PropTypes.object,
    onSelectDimension: PropTypes.func
  },

  renderDimensionSelector() {
    var { metadata, onSelectDimension, vifAuthoring } = this.props;
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
      placeholder: translate('panes.data.fields.dimension.placeholder'),
      options: dimensions,
      onSelection: onSelectDimension
    };

    return (
      <div className="dimension-dropdown-container">
        <label className="block-label" htmlFor="dimension-selection">{translate('panes.data.fields.dimension.title')}:</label>
        <Styleguide.components.Dropdown {...dimensionAttributes} />
      </div>
    );
  },

  render() {
    var { metadata } = this.props;

    return hasData(metadata) ?
      this.renderDimensionSelector() :
      null;
  }
});

function mapStateToProps(state) {
  var { vifAuthoring, metadata } = state;
  return { vifAuthoring, metadata };
}

function mapDispatchToProps(dispatch) {
  return {
    onSelectDimension(dimension) {
      dispatch(setDimension(dimension.value));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(DimensionSelector);
