import _ from 'lodash';
import { connect } from 'react-redux';
import React, { PropTypes } from 'react';
import { factories, Dropdown } from 'common/components';
import I18n from 'common/i18n';
import { AGGREGATION_TYPES, COLUMN_TYPES, MAXIMUM_MEASURES } from '../constants';

import { 
  appendSeriesWithMeasure, 
  removeSeries, 
  setMeasure, 
  setMeasureAggregation } from '../actions';

import { 
  getDimensionGroupingColumnName,
  getSeries,
  isBarChart,
  isColumnChart,
  isFeatureMap,
  isMultiSeries,
  isTimelineChart } from '../selectors/vifAuthoring';

import { hasData, getValidMeasures } from '../selectors/metadata';
import BlockLabel from './shared/BlockLabel';

export const MeasureSelector = React.createClass({
  propTypes: {
    vifAuthoring: PropTypes.object,
    metadata: PropTypes.object,
    onAddMeasure: PropTypes.func,
    onRemoveMeasure: PropTypes.func,
    onSetMeasureColumn: PropTypes.func,
    onSetMeasureAggregation: PropTypes.func,
  },

  getDefaultProps() {
    return {
      aggregationTypes: AGGREGATION_TYPES
    };
  },

  componentDidUpdate() {
    if (this.selector) {
      new factories.FlyoutFactory(this.selector);
    }
  },

  render() {
    const { metadata } = this.props;
    return hasData(metadata) ? this.renderMeasureSelectors() : null;
  },

  renderMeasureSelectors() {
    const {
      metadata,
      vifAuthoring
    } = this.props;

    const validMeasures = getValidMeasures(metadata);
    const options = [{
      title: I18n.translate('shared.visualizations.panes.data.fields.measure.no_value'), value: null},
      ...validMeasures.map(validMeasure => ({
        title: validMeasure.name,
        value: validMeasure.fieldName,
        type: validMeasure.renderTypeName,
        render: this.renderMeasureOption
      }))
    ];

    const series = getSeries(vifAuthoring);
    const items = series.map((item, index) => {
      return this.renderMeasureSelector(item.dataSource.measure, index, options);
    });

    const newMeasureLink = this.renderNewMeasureLink();

    return (
      <div ref={(ref) => this.selector = ref}>
        <BlockLabel title={I18n.translate('shared.visualizations.panes.data.fields.measure.title')} description={I18n.translate('shared.visualizations.panes.data.fields.measure.description')} />
        <ul className="measure-list">
          {items}
        </ul>
        {newMeasureLink}
      </div>
    );
  },

  renderMeasureSelector(measure, index, options) {
    const { vifAuthoring } = this.props;
    const measureListItemAttributes = {
      className: 'measure-list-item',
      key: index
    };

    const hasOnlyDefaultValue = options.length <= 1;
    const measureAttributes = {
      disabled: isFeatureMap(vifAuthoring) || hasOnlyDefaultValue,
      id: `measure-selection-${index}`,
      onSelection: (option) => this.handleOnSelectionMeasureColumn(option, index),
      options,
      value: measure.columnName
    };

    const measureAggregationSelector = this.renderMeasureAggregationSelector(measure, index);
    const deleteLink = this.renderDeleteLink(index);

    return (
        <li {...measureListItemAttributes}>
          <div className="measure-column-selector-dropdown-container">
            <Dropdown {...measureAttributes} />
          </div>
          {measureAggregationSelector}
          {deleteLink}
        </li>
    );
  },

  renderDeleteLink(index) {
    const { vifAuthoring } = this.props;

    const deleteLinkAttributes = {
      className: 'measure-delete-link',
      id: `measure-delete-link-${index}`,
      onClick: () => this.handleOnClickDeleteMeasure(index)
    };

    return isMultiSeries(vifAuthoring) ? (
      <div className="measure-delete-link-container">
        <a {...deleteLinkAttributes}>
          <span className="socrata-icon-close" />
        </a>
      </div>) : 
      null;
  },

  renderMeasureAggregationSelector(measure, index) {
    const {
      aggregationTypes,
      vifAuthoring
    } = this.props;

    if (_.isNull(measure.columnName)) {
      return; // no aggregation dropdown when no column name is selected
    }

    const options = [
      {title: I18n.translate('shared.visualizations.aggregations.none'), value: null},
      ...aggregationTypes.map(aggregationType => ({title: aggregationType.title, value: aggregationType.type}))
    ];

    const measureAggregationAttributes = {
      disabled: isFeatureMap(vifAuthoring),
      id: `measure-aggregation-selection-${index}`,
      onSelection: (option) => this.handleOnSelectionMeasureAggregation(option, index),
      options,
      value: measure.aggregationFunction
    };

    return (
      <div className="measure-aggregation-selector-dropdown-container">
        <Dropdown {...measureAggregationAttributes} />
      </div>);
  },

  renderMeasureOption(option) {
    const columnType = _.find(COLUMN_TYPES, {type: option.type});
    const icon = columnType ? columnType.icon : '';

    return (
      <div className="dataset-column-selector-option">
        <span className={icon}></span> {option.title}
      </div>
    );
  },

  renderNewMeasureLink() {
    const { vifAuthoring } = this.props;
    const series = getSeries(vifAuthoring);
    const showNewMeasureLink = (series.length < MAXIMUM_MEASURES) &&
      _.isEmpty(getDimensionGroupingColumnName(vifAuthoring)) &&
      (isBarChart(vifAuthoring) || isColumnChart(vifAuthoring) || isTimelineChart(vifAuthoring));

    return showNewMeasureLink ? (
      <div className="measure-new-measure-link-container">
        <a id="measure-new-measure-link" onClick={this.handleOnClickNewMeasure}>
          <span className="socrata-icon-add" />
          {I18n.translate('shared.visualizations.panes.data.fields.measure.new_measure')}
        </a>
      </div>) :
      null;
  },

  handleOnClickNewMeasure() {
    const { onAddMeasure } = this.props;
    onAddMeasure({ 
      columnName: null,
      aggregationFunction: 'count',
      label: I18n.translate('shared.visualizations.panes.data.fields.measure.no_value')
    });
  },
  
  handleOnClickDeleteMeasure(index) {
    const { onRemoveMeasure } = this.props;
    onRemoveMeasure(index);
  },

  handleOnSelectionMeasureColumn(option, index) {
    const { onSetMeasureColumn } = this.props;
    onSetMeasureColumn(index, option.value, option.title);
  },

  handleOnSelectionMeasureAggregation(option, index) {
    const { onSetMeasureAggregation } = this.props;
    onSetMeasureAggregation(index, option.value);
  },
});

function mapStateToProps(state) {
  const { vifAuthoring, metadata } = state;
  return { vifAuthoring, metadata };
}

function mapDispatchToProps(dispatch) {
  return {
    onAddMeasure(measure) {
      dispatch(appendSeriesWithMeasure(measure));
    },
    onRemoveMeasure(index) {
      dispatch(removeSeries(index));
    },
    onSetMeasureColumn(index, columnName, label) {
      dispatch(setMeasure(index, columnName, label));
    },
    onSetMeasureAggregation(index, aggregationFunction) {
      dispatch(setMeasureAggregation(index, aggregationFunction));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(MeasureSelector);
