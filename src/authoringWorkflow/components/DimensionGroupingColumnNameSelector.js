import _ from 'lodash';
import { connect } from 'react-redux';
import React, { PropTypes } from 'react';
import Styleguide from 'socrata-components';
import { AccordionPane } from './shared/Accordion.js';
import {
  getDimensionGroupingColumnName
} from '../selectors/vifAuthoring';
import {
  getValidDimensions
} from '../selectors/metadata';
import { setDimensionGroupingColumnName } from '../actions';
import { translate } from '../../I18n';

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
        title: translate(
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

    return (
      <div>
        <span className="authoring-field-subtitle">
          {translate(`panes.data.fields.dimension_grouping_column_name.subtitle`)}
        </span>
        <div className="authoring-field">
          <Styleguide.Dropdown {...dimensionGroupingColumnNameAttributes} />
        </div>
        <p className="authoring-field-description">
          <small>{translate('panes.data.fields.dimension_grouping_column_name.description')}</small>
        </p>
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
