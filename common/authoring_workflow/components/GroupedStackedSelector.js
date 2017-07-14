import { connect } from 'react-redux';
import React, { PropTypes } from 'react';
import I18n from 'common/i18n';
import {
  getDimensionGroupingColumnName,
  isMultiSeries,
  isStacked
} from '../selectors/vifAuthoring';
import {
    setStacked
} from '../actions';

export const GroupedStackedSelector = React.createClass({
  propTypes: {
    metadata: PropTypes.object
  },

  getDefaultProps() {
    return {};
  },

  render() {
    const {
      metadata,
      vifAuthoring
    } = this.props;

    const dimensionGroupingColumnName = getDimensionGroupingColumnName(vifAuthoring);
    const areOptionsDisabled = (dimensionGroupingColumnName === null) && !isMultiSeries(vifAuthoring);
    const stacked = isStacked(vifAuthoring);

    const displayGroupedContainerAttributes = {
      id: 'grouping-display-grouped-container',
      className: `${areOptionsDisabled ? 'disabled': ''}`
    }
    const displayGroupedInputAttributes = {
      id: 'display-grouped',
      type: 'radio',
      name: 'display-grouped-radio',
      onChange: this.props.onSelectGrouped,
      checked: !stacked,
      disabled: areOptionsDisabled
    };

    const displayGroupedContainer = (
      <div {...displayGroupedContainerAttributes}>
        <input {...displayGroupedInputAttributes} />
        <label htmlFor="display-grouped">
          <span className="fake-radiobutton"/>
        </label>
        {I18n.t(`shared.visualizations.panes.data.fields.dimension_grouping_options.grouped`)}
      </div>
    );

    const displayStackedContainerAttributes = {
      id: 'grouping-display-stacked-container',
      className: `${areOptionsDisabled ? 'disabled': ''}`
    }
    const displayStackedInputAttributes = {
      id: 'display-stacked',
      type: 'radio',
      name: 'display-grouped-radio',
      onChange: this.props.onSelectStacked,
      checked: stacked,
      disabled: areOptionsDisabled
    };

    const displayStackedContainer = (
      <div {...displayStackedContainerAttributes}>
        <input {...displayStackedInputAttributes} />
        <label htmlFor="display-stacked">
          <span className="fake-radiobutton"/>
        </label>
        {I18n.t(`shared.visualizations.panes.data.fields.dimension_grouping_options.stacked`)}
      </div>
    );

    return (
      <div className="grouped-stacked-selector-container">
        <div className="authoring-field">
          <span>{I18n.t(`shared.visualizations.panes.data.fields.dimension_grouping_options.title`)}</span>
          <div className="radiobutton">
            {displayGroupedContainer}
            {displayStackedContainer}
          </div>
        </div>
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

  onSelectGrouped: (event) => {
    dispatch(setStacked(false));
  },

  onSelectStacked: (event) => {
    dispatch(setStacked(true));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(GroupedStackedSelector);
