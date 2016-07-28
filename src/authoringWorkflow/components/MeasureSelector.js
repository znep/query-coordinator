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

export var MeasureSelector = React.createClass({
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

  renderMeasureAggregationDropdown() {
    var {
      aggregationTypes,
      onSelectMeasureAggregation,
      vifAuthoring
    } = this.props;

    var measure = getAnyMeasure(vifAuthoring);
    var isNotCountingRows = !_.isNull(measure.columnName);

    if (isNotCountingRows) {
      var options = [
        {title: translate('aggregations.none'), value: null},
        ...aggregationTypes.map(aggregationType => ({title: aggregationType.title, value: aggregationType.type}))
      ];

      var measureAggregationAttributes = {
        options,
        onSelection: onSelectMeasureAggregation,
        value: measure.aggregationFunction,
        id: 'measure-aggregation-selection',
        disabled: isFeatureMap(vifAuthoring)
      };

      return <Styleguide.components.Dropdown {...measureAggregationAttributes} />;
    }
  },

  renderMeasureOption(option) {
    var columnType = _.find(COLUMN_TYPES, {type: option.type});
    var icon = columnType ? columnType.icon : '';

    return (
      <div className="dataset-column-dropdown-option">
        <span className={icon}></span> {option.title}
      </div>
    );
  },

  renderMeasureSelector() {
    var {
      metadata,
      vif,
      onSelectMeasure,
      vifAuthoring
    } = this.props;
    var measure = getAnyMeasure(vifAuthoring);
    var isCountingRows = _.isNull(measure.columnName);
    var measures = getValidMeasures(metadata);
    var visualizationType = _.get(vif, 'series[0].type');

    var classes = classNames('measure-dropdown-container', {
      'measure-dropdown-container-count-rows': isCountingRows
    });

    var options = [
      {title: translate('panes.data.fields.measure.no_value'), value: null},
      ...measures.map(measure => ({
        title: measure.name,
        value: measure.fieldName,
        type: measure.renderTypeName,
        render: this.renderMeasureOption
      }))
    ];

    var measureAttributes = {
      options,
      onSelection: onSelectMeasure,
      value: measure.columnName,
      id: 'measure-selection',
      disabled: isFeatureMap(vifAuthoring)
    };

    return (
      <div>
        <label className="block-label" htmlFor="measure-selection">{translate('panes.data.fields.measure.title')}:</label>
        <div className={classes}>
          <Styleguide.components.Dropdown {...measureAttributes} />
          {this.renderMeasureAggregationDropdown()}
        </div>
        <p className="authoring-field-description">
          <small>{translate('panes.data.fields.measure.description')}</small>
        </p>
      </div>
    );
  },

  render() {
    var { metadata } = this.props;

    return hasData(metadata) ?
      this.renderMeasureSelector() :
      null;
  }
});

function mapStateToProps(state) {
  var { vifAuthoring, metadata } = state;
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
