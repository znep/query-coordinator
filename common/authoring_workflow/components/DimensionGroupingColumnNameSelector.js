import _ from 'lodash';
import { connect } from 'react-redux';
import React, { PropTypes } from 'react';
import { Dropdown } from 'common/components';
import { AccordionPane } from './shared/Accordion.js';
import BlockLabel from './shared/BlockLabel';
import {
  getDimensionGroupingColumnName,
  isBarChart,
  isColumnChart
} from '../selectors/vifAuthoring';
import { getValidDimensions } from '../selectors/metadata';
import { setDimensionGroupingColumnName } from '../actions';
import { I18n } from 'common/visualizations';
import DimensionGroupingStackedSelector from './DimensionGroupingStackedSelector';

export const DimensionGroupingColumnNameSelector = React.createClass({
  propTypes: {
    metadata: PropTypes.object
  },

  getDefaultProps() {
    return {};
  },

  render() {
    const {
      metadata,
      onSelectDimensionGroupingColumnName,
      vifAuthoring
    } = this.props;

    const options = [
      {
        title: I18n.translate(
          'panes.data.fields.dimension_grouping_column_name.no_value'
        ),
        value: null
      },
      ..._.map(
        getValidDimensions(metadata),
        dimension => ({
          title: dimension.name,
          value: dimension.fieldName
        })
      )
    ];

    const dimensionGroupingColumnName = getDimensionGroupingColumnName(vifAuthoring);

    const dimensionGroupingColumnNameAttributes = {
      options,
      onSelection: onSelectDimensionGroupingColumnName,
      value: dimensionGroupingColumnName,
      id: 'dimension-grouping-column-name-selection'
    };

    const displayOptionsContainer = (isBarChart(vifAuthoring) || isColumnChart(vifAuthoring)) ?
      <DimensionGroupingStackedSelector /> :
      null;

    return (
      <div>
        <div className="authoring-field">
          <BlockLabel
            title={I18n.translate(`panes.data.fields.dimension_grouping_column_name.subtitle`)}
            htmlFor={dimensionGroupingColumnNameAttributes.id}
            description={I18n.translate('panes.data.fields.dimension_grouping_column_name.description')} />
          <Dropdown {...dimensionGroupingColumnNameAttributes} />
        </div>
        <p className="authoring-field-description">
          <small>{I18n.translate('panes.data.fields.dimension_grouping_column_name.description')}</small>
        </p>
        {displayOptionsContainer}
      </div>
    );
  }
});

const mapStateToProps = state => {
  const { vifAuthoring, metadata } = state;

  return {
    vifAuthoring,
    metadata
  };
};

const mapDispatchToProps = dispatch => ({

  onSelectDimensionGroupingColumnName(selected) {
    dispatch(setDimensionGroupingColumnName(selected.value));
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(DimensionGroupingColumnNameSelector);
