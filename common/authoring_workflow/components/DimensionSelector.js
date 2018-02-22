import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Dropdown, Picklist } from 'common/components';
import Dimension from './Dimension';
import I18n from 'common/i18n';

import { setDimension, setOrderBy, setXAxisScalingMode } from '../actions';
import { getRecommendedDimensions, getValidDimensions, hasData } from '../selectors/metadata';
import { getAnyDimension, getVisualizationType, isNewGLMap } from '../selectors/vifAuthoring';

export class DimensionSelector extends Component {
  onChangeDimension = (dimension) => {
    if (dimension == null) {
      return;
    }

    const { onSelectDimension, onSelectOrderBy, onSetXAxisScalingModePan } = this.props;

    onSelectDimension(dimension);

    if (dimension.type === 'calendar_date') {
      onSelectOrderBy('dimension', 'asc');
    } else {
      onSelectOrderBy('measure', 'desc');
      onSetXAxisScalingModePan();
    }
  }

  renderDimensionOption = (recommended, option) => {
    return (
      <div className="dataset-column-selector-option">
        <Dimension type={option.type} name={option.title} recommended={recommended} />
      </div>
    );
  }

  renderDimensionSelector = () => {
    const { metadata, vifAuthoring, onSelectDimension } = this.props;
    const dimension = getAnyDimension(vifAuthoring);
    const scope = 'shared.visualizations.panes.data.fields.dimension.groups';
    const visualizationType = getVisualizationType(vifAuthoring);
    const value = dimension.columnName;
    const recommendedDimensionRenderer = this.renderDimensionOption.bind(this, true);
    const dimensionRenderer = this.renderDimensionOption.bind(this, false);
    const buildOption = (recommended, group) => {
      return (dimension) => ({
        group,
        render: recommended ? recommendedDimensionRenderer : dimensionRenderer,
        title: dimension.name,
        type: dimension.renderTypeName,
        value: dimension.fieldName
      });
    };
    const toRenderableOption = buildOption(false, I18n.t('all_columns', { scope }));
    const renderableOptions = _.map(getValidDimensions(metadata), toRenderableOption);
    const toRenderableRecommendedOption = buildOption(true, I18n.t('recommended_columns', { scope }));
    const renderableRecommendedOptions = _.map(
      getRecommendedDimensions(metadata, visualizationType),
      toRenderableRecommendedOption
    );
    let dimensionAttributes = {};

    if (isNewGLMap(vifAuthoring)) {
      dimensionAttributes = {
        id: 'geo-column-selection',
        options: [
          ...renderableRecommendedOptions,
          ...renderableOptions
        ],
        value,
        onSelection: onSelectDimension
      };

      return (
        <div className="geo-column-selector-container">
          <Dropdown {...dimensionAttributes} />
        </div>
      );
    }

    const isNotSelectedDimension = (option) => option.value !== value;

    dimensionAttributes = {
      id: 'dimension-selection',
      options: [
        ...renderableRecommendedOptions.filter(isNotSelectedDimension),
        ...renderableOptions.filter(isNotSelectedDimension)
      ],
      onChange: this.onChangeDimension,
      onSelection: this.onChangeDimension,
      value
    };

    return (
      <div className="dimension-selector-container">
        <Picklist {...dimensionAttributes} />
      </div>
    );
  }

  render() {
    return hasData(this.props.metadata) ? this.renderDimensionSelector() : null;
  }
}

DimensionSelector.propTypes = {
  metadata: PropTypes.object,
  onSelectDimension: PropTypes.func,
  onSelectOrderBy: PropTypes.func,
  onSetXAxisScalingModePan: PropTypes.func,
  vifAuthoring: PropTypes.object
};

function mapStateToProps(state) {
  return _.pick(state, ['metadata', 'vifAuthoring']);
}

function mapDispatchToProps(dispatch) {
  return {
    onSelectDimension: (dimension) => {
      dispatch(setDimension(dimension.value));
    },

    onSelectOrderBy: (parameter, sort) => {
      dispatch(setOrderBy({ parameter, sort }));
    },

    onSetXAxisScalingModePan: () => {
      dispatch(setXAxisScalingMode({ shouldFit: false }));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(DimensionSelector);
