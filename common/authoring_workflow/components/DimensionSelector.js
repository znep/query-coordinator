import _ from 'lodash';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Picklist } from 'common/components';
import I18n from 'common/i18n';

import Dimension from './Dimension';
import { setDimension, setOrderBy } from '../actions';
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

export class DimensionSelector extends Component {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'renderDimensionOption',
      'renderDimensionSelector',
      'onChangeDimension'
    ]);
  }

  renderDimensionOption(recommended, option) { // eslint-disable-line react/sort-comp
    return (
      <div className="dataset-column-selector-option">
        <Dimension type={option.type} name={option.title} recommended={recommended} />
      </div>
    );
  }

  renderDimensionSelector() {
    const { metadata, vifAuthoring } = this.props;
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

  onChangeDimension(dimension) {
    const { onSelectDimension, onSelectOrderBy } = this.props;

    if (dimension == null) {
      return;
    }

    onSelectDimension(dimension);

    if (dimension.type === 'calendar_date') {
      onSelectOrderBy('dimension', 'asc');
    } else {
      onSelectOrderBy('measure', 'desc');
    }
  }

  render() {
    return hasData(this.props.metadata) ?
      this.renderDimensionSelector() :
      null;
  }
}

DimensionSelector.propTypes = {
  metadata: PropTypes.object,
  onSelectDimension: PropTypes.func,
  onSelectOrderBy: PropTypes.func,
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
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(DimensionSelector);
