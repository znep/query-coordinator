import _ from 'lodash';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import I18n from 'common/i18n';
import {
  hasDimensionGroupingColumnName,
  isMultiSeries,
  isOneHundredPercentStacked,
  isStacked
} from '../selectors/vifAuthoring';
import {
    setStacked
} from '../actions';

export class GroupedStackedSelector extends Component {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'renderGroupedContainer',
      'renderStackedContainer',
      'renderOneHundredPercentStackedContainer'
    ]);
  }

  render() {
    const { vifAuthoring } = this.props;

    const stacked = isStacked(vifAuthoring);
    const oneHundredPercentStacked = isOneHundredPercentStacked(vifAuthoring);
    const disabled = !hasDimensionGroupingColumnName(vifAuthoring) && !isMultiSeries(vifAuthoring);

    const groupedContainer = this.renderGroupedContainer({ checked: !stacked, disabled });
    const stackedContainer = this.renderStackedContainer({ checked: stacked && !oneHundredPercentStacked, disabled });
    const oneHundredPercentStackedContainer = this.renderOneHundredPercentStackedContainer({ checked: oneHundredPercentStacked, disabled });

    return (
      <div className="grouped-stacked-selector-container">
        <div className="authoring-field">
          <span>{I18n.t(`shared.visualizations.panes.data.fields.dimension_grouping_options.title`)}</span>
          <div className="radiobutton">
            {groupedContainer}
            {stackedContainer}
            {oneHundredPercentStackedContainer}
          </div>
        </div>
      </div>
    );
  }

  renderGroupedContainer({ checked, disabled }) {

    const containerAttributes = {
      id: 'grouping-display-grouped-container',
      className: `${disabled ? 'disabled' : null}`
    }

    const inputAttributes = {
      id: 'display-grouped',
      type: 'radio',
      name: 'display-grouped-radio',
      onChange: this.props.onSelectGrouped,
      checked,
      disabled
    };

    return (
      <div {...containerAttributes}>
        <input {...inputAttributes} />
        <label htmlFor="display-grouped">
          <span className="fake-radiobutton"/>
        </label>
        {I18n.t(`shared.visualizations.panes.data.fields.dimension_grouping_options.grouped`)}
      </div>
    );
  }

  renderStackedContainer({ checked, disabled }) {

    const containerAttributes = {
      id: 'grouping-display-stacked-container',
      className: `${disabled ? 'disabled': null}`
    }

    const inputAttributes = {
      id: 'display-stacked',
      type: 'radio',
      name: 'display-grouped-radio',
      onChange: this.props.onSelectStacked,
      checked,
      disabled
    };

    return (
      <div {...containerAttributes}>
        <input {...inputAttributes} />
        <label htmlFor="display-stacked">
          <span className="fake-radiobutton"/>
        </label>
        {I18n.t(`shared.visualizations.panes.data.fields.dimension_grouping_options.stacked`)}
      </div>
    );
  }

  renderOneHundredPercentStackedContainer({ checked, disabled }) {
    const containerAttributes = {
      id: 'grouping-display-100-percent-stacked-container',
      className: `${disabled ? 'disabled': ''}`
    }

    const inputAttributes = {
      id: 'display-100-percent-stacked',
      type: 'radio',
      name: 'display-grouped-radio',
      onChange: this.props.onSelectOneHundredPercentStacked,
      checked,
      disabled
    };

    return (
      <div {...containerAttributes}>
        <input {...inputAttributes} />
        <label htmlFor="display-100-percent-stacked">
          <span className="fake-radiobutton"/>
        </label>
        {I18n.t(`shared.visualizations.panes.data.fields.dimension_grouping_options.one_hundred_percent_stacked`)}
      </div>
    );
  }
}

GroupedStackedSelector.propTypes = {
  metadata: PropTypes.object
};

const mapStateToProps = state => {
  const { vifAuthoring, metadata } = state;
  return { vifAuthoring, metadata };
};

const mapDispatchToProps = dispatch => ({
  onSelectGrouped: event => dispatch(setStacked({ stacked: false, oneHundredPercent: false })),
  onSelectStacked: event => dispatch(setStacked({ stacked: true, oneHundredPercent: false })),
  onSelectOneHundredPercentStacked: event => dispatch(setStacked({ stacked: true, oneHundredPercent: true }))
});

export default connect(mapStateToProps, mapDispatchToProps)(GroupedStackedSelector);
