import _ from 'lodash';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { factories, Dropdown } from 'common/components';
import I18n from 'common/i18n';
import { AGGREGATION_TYPES, COLUMN_TYPES, MAXIMUM_MEASURES } from '../constants';

import { 
  appendSeries, 
  removeSeries, 
  setMeasure, 
  setMeasureAggregation } from '../actions';

import { 
  getDimensionGroupingColumnName,
  getSeries,
  hasErrorBars,
  isBarChart,
  isColumnChart,
  isFeatureMap,
  isMultiSeries,
  isTimelineChart } from '../selectors/vifAuthoring';

import { hasData, getValidMeasures } from '../selectors/metadata';
import BlockLabel from './shared/BlockLabel';

export class MeasureSelector extends Component {
  constructor(props) {
    super(props);

    this.state = { isSeriesPending:  false };

    _.bindAll(this, [
      'renderMeasureSelectors',
      'renderPendingMeasureSelector',
      'renderMeasureSelector',
      'renderMeasureAggregationSelector',
      'renderMeasureOption',
      'renderDeleteMeasureLink',
      'renderAddMeasureLink',
      'handleOnClickAddMeasure',
      'handleOnClickDeleteMeasure',
      'handleOnSelectionMeasureColumn',
      'handleOnSelectionMeasureAggregation'
    ]);
  }

  componentDidUpdate() {
    if (this.selector) {
      new factories.FlyoutFactory(this.selector);
    }
  }

  render() {
    const { metadata } = this.props;
    return hasData(metadata) ? this.renderMeasureSelectors() : null;
  }

  renderMeasureSelectors() {
    const { metadata, vifAuthoring } = this.props;
    const { isSeriesPending } = this.state;

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
    const measureSelectors = series.map((item, seriesIndex) => {
      return this.renderMeasureSelector(item.dataSource.measure, seriesIndex, options);
    });

    let pendingMeasureSelector;

    if (isSeriesPending) {
      pendingMeasureSelector = this.renderPendingMeasureSelector(series.length, options);
    }

    const addMeasureLink = this.renderAddMeasureLink();

    return (
      <div ref={(ref) => this.selector = ref}>
        <BlockLabel title={I18n.translate('shared.visualizations.panes.data.fields.measure.title')} description={I18n.translate('shared.visualizations.panes.data.fields.measure.description')} />
        <ul className="measure-list">
          {measureSelectors}
          {pendingMeasureSelector}
        </ul>
        {addMeasureLink}
      </div>
    );
  }

  renderPendingMeasureSelector(seriesIndex, options) {
    const { vifAuthoring } = this.props;
    const measureListItemAttributes = {
      className: 'measure-list-item',
      key: seriesIndex
    };

    const hasOnlyDefaultValue = options.length <= 1;
    const measureAttributes = {
      disabled: isFeatureMap(vifAuthoring) || hasOnlyDefaultValue,
      id: `measure-selection-${seriesIndex}`,
      onSelection: (option) => this.handleOnSelectionMeasureColumn(seriesIndex, option),
      options,
      placeholder: I18n.translate('shared.visualizations.panes.data.fields.measure.select_column')
    };

    const deleteMeasureLink = this.renderDeleteMeasureLink(seriesIndex);

    return (
      <li {...measureListItemAttributes}>
        <div className="measure-column-selector-dropdown-container">
          <Dropdown {...measureAttributes} />
        </div>
        {deleteMeasureLink}
      </li>
    );
  }

  renderMeasureSelector(measure, seriesIndex, options) {
    const { vifAuthoring } = this.props;
    const measureListItemAttributes = {
      className: 'measure-list-item',
      key: seriesIndex
    };

    const hasOnlyDefaultValue = options.length <= 1;
    const measureAttributes = {
      disabled: isFeatureMap(vifAuthoring) || hasOnlyDefaultValue,
      id: `measure-selection-${seriesIndex}`,
      onSelection: (option) => this.handleOnSelectionMeasureColumn(seriesIndex, option),
      options,
      value: measure.columnName
    };

    const measureAggregationSelector = this.renderMeasureAggregationSelector(measure, seriesIndex);
    const deleteMeasureLink = this.renderDeleteMeasureLink(seriesIndex);

    return (
      <li {...measureListItemAttributes}>
        <div className="measure-column-selector-dropdown-container">
          <Dropdown {...measureAttributes} />
        </div>
        {measureAggregationSelector}
        {deleteMeasureLink}
      </li>
    );
  }

  renderMeasureAggregationSelector(measure, seriesIndex) {
    const { aggregationTypes, vifAuthoring } = this.props;

    if (_.isNull(measure.columnName)) {
      return null; // no aggregation dropdown when no column name is selected
    }

    const options = [
      {title: I18n.translate('shared.visualizations.aggregations.none'), value: null},
      ...aggregationTypes.map(aggregationType => ({title: aggregationType.title, value: aggregationType.type}))
    ];

    const measureAggregationAttributes = {
      disabled: isFeatureMap(vifAuthoring),
      id: `measure-aggregation-selection-${seriesIndex}`,
      onSelection: (option) => this.handleOnSelectionMeasureAggregation(seriesIndex, option),
      options,
      value: measure.aggregationFunction
    };

    return (
      <div className="measure-aggregation-selector-dropdown-container">
        <Dropdown {...measureAggregationAttributes} />
      </div>
    );
  }

  renderMeasureOption(option) {
    const columnType = _.find(COLUMN_TYPES, { type: option.type });
    const icon = columnType ? columnType.icon : '';

    return (
      <div className="dataset-column-selector-option">
        <span className={icon}></span> {option.title}
      </div>
    );
  }

  renderDeleteMeasureLink(seriesIndex) {
    const { vifAuthoring } = this.props;
    const { isSeriesPending } = this.state;

    const deleteLinkAttributes = {
      className: 'measure-delete-link',
      id: `measure-delete-link-${seriesIndex}`,
      onClick: () => this.handleOnClickDeleteMeasure(seriesIndex)
    };

    return (isSeriesPending || isMultiSeries(vifAuthoring)) ? (
      <div className="measure-delete-link-container">
        <a {...deleteLinkAttributes}>
          <span className="socrata-icon-close" />
        </a>
      </div>) : 
      null;
  }

  renderAddMeasureLink() {
    const { vifAuthoring } = this.props;
    const { isSeriesPending } = this.state;

    const series = getSeries(vifAuthoring);
    const shouldRender = (series.length < MAXIMUM_MEASURES) &&
      (isBarChart(vifAuthoring) || isColumnChart(vifAuthoring) || isTimelineChart(vifAuthoring));

    const isDisabled = isSeriesPending || 
      !_.isEmpty(getDimensionGroupingColumnName(vifAuthoring)) ||
      hasErrorBars(vifAuthoring);

    const addMeasureLinkAttributes = {
      id: 'measure-add-measure-link',
      className: isDisabled ? 'disabled' : null,
      onClick: isDisabled ? null : this.handleOnClickAddMeasure
    };

    return shouldRender ? (
      <div className="measure-add-measure-link-container">
        <a {...addMeasureLinkAttributes}>
          <span className="socrata-icon-add" />
          {I18n.translate('shared.visualizations.panes.data.fields.measure.add_measure')}
        </a>
      </div>) :
      null;
  }

  handleOnClickAddMeasure() {
    this.setState({ isSeriesPending: true });
  }

  handleOnClickDeleteMeasure(seriesIndex) {
    const { onRemoveMeasure } = this.props;
    const { isSeriesPending } = this.state;

    if (isSeriesPending) {
      this.setState({ isSeriesPending: false });
    }
    else {
      onRemoveMeasure(seriesIndex);
    }
  }

  handleOnSelectionMeasureColumn(seriesIndex, option) {
    const { onAddMeasure, onSetMeasureColumn, vifAuthoring } = this.props;
    const { isSeriesPending } = this.state;

    const series = getSeries(vifAuthoring);

    if (isSeriesPending && (seriesIndex == series.length)) {

      onAddMeasure(seriesIndex, option.value);
      this.setState({ isSeriesPending: false });

    } else {

      onSetMeasureColumn(seriesIndex, option.value);
    }
  }

  handleOnSelectionMeasureAggregation(seriesIndex, option) {
    const { onSetMeasureAggregation } = this.props;
    onSetMeasureAggregation(seriesIndex, option.value);
  }
}

MeasureSelector.propTypes = {
  vifAuthoring: PropTypes.object,
  metadata: PropTypes.object,
  onAddMeasure: PropTypes.func,
  onRemoveMeasure: PropTypes.func,
  onSetMeasureColumn: PropTypes.func,
  onSetMeasureAggregation: PropTypes.func,
};

MeasureSelector.defaultProps = { aggregationTypes: AGGREGATION_TYPES };

function mapStateToProps(state) {
  const { vifAuthoring, metadata } = state;
  return { vifAuthoring, metadata };
}

function mapDispatchToProps(dispatch) {
  return {
    onAddMeasure(seriesIndex, columnName) {
      dispatch(appendSeries({ isInitialLoad: false }));
      dispatch(setMeasure(seriesIndex, columnName));
    },
    onRemoveMeasure(seriesIndex) {
      dispatch(removeSeries(seriesIndex));
    },
    onSetMeasureColumn(seriesIndex, columnName) {
      dispatch(setMeasure(seriesIndex, columnName));
    },
    onSetMeasureAggregation(seriesIndex, aggregationFunction) {
      dispatch(setMeasureAggregation(seriesIndex, aggregationFunction));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(MeasureSelector);
