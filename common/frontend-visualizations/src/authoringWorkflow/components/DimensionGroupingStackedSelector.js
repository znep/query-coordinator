import { connect } from 'react-redux';
import React, { PropTypes } from 'react';
import { 
  getDimensionGroupingColumnName,
  getStacked,
} from '../selectors/vifAuthoring';
import { 
    setStacked
} from '../actions';
import { translate } from '../../I18n';

export const DimensionGroupingStackedSelector = React.createClass({

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
    const areOptionsDisabled = (dimensionGroupingColumnName === null);
    const isStacked = getStacked(vifAuthoring);
    const displayGroupedContainerAttributes = {
      id: 'grouping-display-grouped-container',
      className: `${areOptionsDisabled ? 'disabled': ''}`
    }
    const displayGroupedInputAttributes = {
      id: 'display-grouped',
      type: 'radio',
      name: 'display-grouped-radio',
      onChange: this.props.onSelectGrouped,
      checked: !isStacked,
      disabled: areOptionsDisabled
    };

    const displayGroupedContainer = (
      <div {...displayGroupedContainerAttributes}>
        <input {...displayGroupedInputAttributes} />
        <label htmlFor="display-grouped">
          <span className="fake-radiobutton"/>
        </label>
        {translate(`panes.data.fields.dimension_grouping_options.grouped`)}
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
      checked: isStacked,
      disabled: areOptionsDisabled
    };

    const displayStackedContainer = (
      <div {...displayStackedContainerAttributes}>
        <input {...displayStackedInputAttributes} />
        <label htmlFor="display-stacked">
          <span className="fake-radiobutton"/>
        </label>
        {translate(`panes.data.fields.dimension_grouping_options.stacked`)}
      </div>
    );

    return (
      <div>
        <span id="grouping-options-title">{translate(`panes.data.fields.dimension_grouping_options.title`)}</span>
        <div className="authoring-field">
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

export default connect(mapStateToProps, mapDispatchToProps)(DimensionGroupingStackedSelector);
