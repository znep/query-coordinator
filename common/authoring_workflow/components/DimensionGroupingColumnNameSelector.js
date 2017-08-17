import _ from 'lodash';
import { connect } from 'react-redux';
import React, { PropTypes } from 'react';
import { Dropdown } from 'common/components';
import BlockLabel from './shared/BlockLabel';
import {
  getDimension,
  getDimensionGroupingColumnName
} from '../selectors/vifAuthoring';
import { getValidDimensions } from '../selectors/metadata';
import { setDimensionGroupingColumnName } from '../actions';
import I18n from 'common/i18n';

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

    const validDimensions = _.map(
      getValidDimensions(metadata),
      dimension => ({
        title: dimension.name,
        value: dimension.fieldName
      })
    );

    const selectedDimension = getDimension(vifAuthoring);
    const validGroupingDimensions = _.reject(
      validDimensions,
      { value: _.get(selectedDimension, 'columnName') }
    );

    const options = [
      {
        title: I18n.t(
          'shared.visualizations.panes.data.fields.dimension_grouping_column_name.no_value'
        ),
        value: null
      },
      ...validGroupingDimensions
    ];

    const dimensionGroupingColumnName = getDimensionGroupingColumnName(vifAuthoring);

    const dimensionGroupingColumnNameAttributes = {
      options,
      onSelection: onSelectDimensionGroupingColumnName,
      value: dimensionGroupingColumnName,
      id: 'dimension-grouping-column-name-selection'
    };

    return (
      <div className="authoring-field">
        <BlockLabel
          title={I18n.t(`shared.visualizations.panes.data.fields.dimension_grouping_column_name.subtitle`)}
          htmlFor={dimensionGroupingColumnNameAttributes.id}
          description={I18n.t('shared.visualizations.panes.data.fields.dimension_grouping_column_name.description')} />
        <Dropdown {...dimensionGroupingColumnNameAttributes} />
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
