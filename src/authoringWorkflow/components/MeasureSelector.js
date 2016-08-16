import _ from 'lodash';
import { connect } from 'react-redux';
import classNames from 'classnames';
import React, { PropTypes } from 'react';
import Styleguide from 'socrata-styleguide';

import { translate } from '../../I18n';
import { AGGREGATION_TYPES, COLUMN_TYPES } from '../constants';
import { setMeasure, setMeasureAggregation } from '../actions';
import { getAnyMeasure, isFeatureMap } from '../selectors/vifAuthoring';
import { hasData, getValidMeasures } from '../selectors/metadata';

export const MeasureSelector = React.createClass({
  propTypes: {
    vifAuthoring: PropTypes.object,
    metadata: PropTypes.object,
    onSelectMeasure: PropTypes.func,
    onSelectMeasureAggregation: PropTypes.func
  },

  getDefaultProps() {
    return {
      aggregationTypes: AGGREGATION_TYPES
    };
  },

  componentDidUpdate() {
    if (this.selector) {
      Styleguide.attachTo(this.selector);
    }
  },

  renderMeasureAggregationDropdown() {
    const {
      aggregationTypes,
      onSelectMeasureAggregation,
      vifAuthoring
    } = this.props;

    const measure = getAnyMeasure(vifAuthoring);
    const isNotCountingRows = !_.isNull(measure.columnName);

    if (isNotCountingRows) {
      const options = [
        {title: translate('aggregations.none'), value: null},
        ...aggregationTypes.map(aggregationType => ({title: aggregationType.title, value: aggregationType.type}))
      ];

      const measureAggregationAttributes = {
        options,
        onSelection: onSelectMeasureAggregation,
        value: measure.aggregationFunction,
        id: 'measure-aggregation-selection',
        disabled: isFeatureMap(vifAuthoring)
      };

      return <Styleguide.components.Dropdown {...measureAggregationAttributes} />;
    }
  },

  renderMeasureEmptyFlyout() {
    const flyoutAttributes = {
      id: 'measure-empty-flyout',
      className: 'measure-empty-flyout flyout flyout-hidden'
    };

    return (
      <div {...flyoutAttributes}>
        <section className="flyout-content">
          <p>{translate('panes.data.fields.measure.empty_measure')}</p>
        </section>
      </div>
    );
  },

  renderMeasureOption(option) {
    const columnType = _.find(COLUMN_TYPES, {type: option.type});
    const icon = columnType ? columnType.icon : '';

    return (
      <div className="dataset-column-dropdown-option">
        <span className={icon}></span> {option.title}
      </div>
    );
  },

  renderMeasureSelector() {
    const {
      metadata,
      vif,
      onSelectMeasure,
      vifAuthoring
    } = this.props;

    const measure = getAnyMeasure(vifAuthoring);
    const isCountingRows = _.isNull(measure.columnName);
    const measures = getValidMeasures(metadata);
    const visualizationType = _.get(vif, 'series[0].type');

    const classes = classNames('measure-dropdown-container', {
      'measure-dropdown-container-count-rows': isCountingRows
    });

    const options = [
      {title: translate('panes.data.fields.measure.no_value'), value: null},
      ...measures.map(measure => ({
        title: measure.name,
        value: measure.fieldName,
        type: measure.renderTypeName,
        render: this.renderMeasureOption
      }))
    ];

    const hasOnlyDefaultValue = options.length <= 1;
    const measureAttributes = {
      options,
      onSelection: onSelectMeasure,
      value: measure.columnName,
      id: 'measure-selection',
      disabled: isFeatureMap(vifAuthoring) || hasOnlyDefaultValue
    };

    const measureFlyout = hasOnlyDefaultValue ? this.renderMeasureEmptyFlyout() : null;

    return (
      <div ref={(ref) => this.selector = ref}>
        <label className="block-label" htmlFor="measure-selection">{translate('panes.data.fields.measure.title')}</label>
        <div className={classes} data-flyout="measure-empty-flyout">
          <Styleguide.components.Dropdown {...measureAttributes} />
          {this.renderMeasureAggregationDropdown()}
        </div>
        <p className="authoring-field-description">
          <small>{translate('panes.data.fields.measure.description')}</small>
        </p>
        {measureFlyout}
      </div>
    );
  },

  render() {
    const { metadata } = this.props;

    return hasData(metadata) ?
      this.renderMeasureSelector() :
      null;
  }
});

function mapStateToProps(state) {
  const { vifAuthoring, metadata } = state;
  return { vifAuthoring, metadata };
}

function mapDispatchToProps(dispatch) {
  return {
    onSelectMeasure(measure) {
      dispatch(setMeasure(measure.value));
    },

    onSelectMeasureAggregation(measureAggregation) {
      dispatch(setMeasureAggregation(measureAggregation.value));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(MeasureSelector);
