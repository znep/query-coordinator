import _ from 'lodash';
import { connect } from 'react-redux';
import React, { PropTypes } from 'react';
import Styleguide from 'socrata-components';

import { translate } from '../../I18n';
import { setDimension } from '../actions';
import { COLUMN_TYPES, INPUT_DEBOUNCE_MILLISECONDS } from '../constants';
import {
  getAnyDimension,
  getVisualizationType,
  isMap
} from '../selectors/vifAuthoring';

import {
  getAnyLocationColumn,
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

  renderDimensionOption(option) {
    const columnType = _.find(COLUMN_TYPES, {type: option.type});

    return (
      <div className="dataset-column-selector-option">
        <span className={columnType.icon}></span> {option.title}
      </div>
    );
  },

  renderDimensionSelector() {
    const { metadata, onSelectDimension, vifAuthoring } = this.props;
    const dimension = getAnyDimension(vifAuthoring);
    const type = getVisualizationType(vifAuthoring);
    const value = dimension.columnName;

    const buildOption = group => {
      return dimension => ({
        title: dimension.name,
        value: dimension.fieldName,
        type: dimension.renderTypeName,
        render: this.renderDimensionOption,
        group
      });
    };

    const toRenderableRecommendedOption = buildOption(translate('panes.data.fields.dimension.groups.recommended_columns'));
    const toRenderableOption = buildOption(translate('panes.data.fields.dimension.groups.all_columns'));

    const dimensions = [
      ..._.map(getRecommendedDimensions(metadata, type), toRenderableRecommendedOption),
      ..._.map(getValidDimensions(metadata), toRenderableOption)
    ];

    const dimensionAttributes = {
      id: 'dimension-selection',
      options: dimensions,
      onSelection: onSelectDimension,
      value
    };

    return (
      <div className="dimension-selector-container">
        <label className="block-label" htmlFor="dimension-selection">{translate('panes.data.fields.dimension.title')}</label>
        <Styleguide.Picklist {...dimensionAttributes} />
        <p className="authoring-field-description">
          <small>{translate('panes.data.fields.dimension.description')}</small>
        </p>
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
    onSelectDimension: _.debounce((dimension) => {
      dispatch(setDimension(dimension.value));
    }, INPUT_DEBOUNCE_MILLISECONDS)
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(DimensionSelector);
