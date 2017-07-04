import _ from 'lodash';
import { connect } from 'react-redux';
import React, { PropTypes } from 'react';
import { Picklist } from 'common/components';
import I18n from 'common/i18n';

import Dimension from './Dimension';
import { setDimension } from '../actions';
import { INPUT_DEBOUNCE_MILLISECONDS } from '../constants';
import {
  getAnyDimension,
  getVisualizationType
} from '../selectors/vifAuthoring';

import {
  getRecommendedDimensions,
  getValidDimensions,
  hasData
} from '../selectors/metadata';

export const DimensionSelector = React.createClass({
  propTypes: {
    vifAuthoring: PropTypes.object,
    metadata: PropTypes.object,
    onSelectDimension: PropTypes.func
  },

  renderDimensionOption(recommended, option) {
    return (
      <div className="dataset-column-selector-option">
        <Dimension type={option.type} name={option.title} recommended={recommended} />
      </div>
    );
  },

  renderDimensionSelector() {
    const { metadata, onSelectDimension, vifAuthoring } = this.props;
    const dimension = getAnyDimension(vifAuthoring);
    const type = getVisualizationType(vifAuthoring);
    const value = dimension.columnName;

    const recommendedDimensionRenderer = this.renderDimensionOption.bind(this, true);
    const dimensionRenderer = this.renderDimensionOption.bind(this, false);

    const buildOption = (recommended, group) => {
      return dimension => ({
        title: dimension.name,
        value: dimension.fieldName,
        type: dimension.renderTypeName,
        render: recommended ? recommendedDimensionRenderer : dimensionRenderer,
        group
      });
    };

    const toRenderableRecommendedOption = buildOption(
      true,
      I18n.t('shared.visualizations.panes.data.fields.dimension.groups.recommended_columns')
    );
    const toRenderableOption = buildOption(false, I18n.t('shared.visualizations.panes.data.fields.dimension.groups.all_columns'));

    const isNotSelectedDimension = (option) => option.value !== value;

    const dimensions = [
      ..._.map(getRecommendedDimensions(metadata, type), toRenderableRecommendedOption).filter(isNotSelectedDimension),
      ..._.map(getValidDimensions(metadata), toRenderableOption).filter(isNotSelectedDimension)
    ];

    const dimensionAttributes = {
      id: 'dimension-selection',
      options: dimensions,
      onChange: onSelectDimension,
      onSelection: onSelectDimension,
      value
    };

    return (
      <div className="dimension-selector-container">
        <Picklist {...dimensionAttributes} />
      </div>
    );
  },

  render() {
    const { metadata } = this.props;

    return hasData(metadata) ?
      this.renderDimensionSelector() :
      null;
  }
});

function mapStateToProps(state) {
  const { vifAuthoring, metadata } = state;
  return { vifAuthoring, metadata };
}

function mapDispatchToProps(dispatch) {
  return {
    onSelectDimension: (dimension) => {
      dispatch(setDimension(dimension.value));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(DimensionSelector);
