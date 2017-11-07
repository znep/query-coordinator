import _ from 'lodash';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { factories, Dropdown } from 'common/components';
import I18n from 'common/i18n';
import {
  AGGREGATION_TYPES,
  COLUMN_TYPES,
  COMBO_CHART_COLUMN,
  MAXIMUM_MEASURES,
  MAXIMUM_COMBO_CHART_MEASURES
} from '../constants';

import {
  appendSeries,
  removeSeries,
  setMeasure,
  setMeasureAggregation,
  setSeriesType
} from '../actions';

import {
  getDimensionGroupingColumnName,
  getSeries,
  hasErrorBars,
  isBarChart,
  isColumnChart,
  isComboChart,
  isFeatureMap,
  isMultiSeries,
  isTimelineChart
} from '../selectors/vifAuthoring';

import {
  hasData,
  getValidMeasures
} from '../selectors/metadata';

export class MeasureSelector extends Component {
  constructor(props) {
    super(props);

    this.state = { isSeriesPending:  false };
  }

  componentDidUpdate() {
    if (this.selector) {
      new factories.FlyoutFactory(this.selector);
    }
  }

  handleOnClickAddMeasure() {
    this.setState({ isSeriesPending: true });
  }

  handleOnClickDeleteMeasure(seriesIndex) {
    this.props.onRemoveMeasure(seriesIndex);
  }

  handleOnClickDeletePendingMeasure() {
    this.setState({ isSeriesPending: false });
  }

  handleOnSelectionMeasureColumn(seriesIndex, option) {
    this.props.onSetMeasureColumn(seriesIndex, option.value);
  }

  handleOnSelectionPendingMeasureColumn(option) {
    const {
      onAddMeasure,
      onSetMeasureColumn,
      onSetSeriesType,
      seriesType,
      vifAuthoring
    } = this.props;

    const allSeries = getSeries(vifAuthoring);
    let seriesIndex;

    if (isComboChart(vifAuthoring) && (seriesType === COMBO_CHART_COLUMN)) {

      // Insert column series after the last column series or if there are none, insert it at index 0.
      // New line series are just appended to the end of the series array like series on non-combo charts.
      //
      const lastIndexOf = _.findLastIndex(allSeries, (series) => series.type === COMBO_CHART_COLUMN);
      seriesIndex = lastIndexOf + 1;

    } else {
      seriesIndex = allSeries.length;
    }

    onAddMeasure(seriesIndex);
    onSetMeasureColumn(seriesIndex, option.value);

    if (!_.isEmpty(seriesType)) {
      onSetSeriesType(seriesIndex, seriesType);
    }

    this.setState({ isSeriesPending: false });
  }

  handleOnSelectionMeasureAggregation(seriesIndex, option) {
    const { onSetMeasureAggregation } = this.props;
    onSetMeasureAggregation(seriesIndex, option.value);
  }

  renderMeasureSelectors() {
    const { metadata, series, vifAuthoring } = this.props;
    const { isSeriesPending } = this.state;

    const validMeasures = getValidMeasures(metadata);
    const options = [
      {
        title: I18n.translate('shared.visualizations.panes.data.fields.measure.no_value'),
        value: null
      },
      ...validMeasures.map((validMeasure) => ({
        title: validMeasure.name,
        value: validMeasure.fieldName,
        type: validMeasure.renderTypeName,
        render: this.renderMeasureOption
      }))
    ];

    const measureSelectors = series.map((seriesItem) => this.renderMeasureSelector(seriesItem, options));
    const pendingMeasureSelector = isSeriesPending ? this.renderPendingMeasureSelector(options) : null;
    const addMeasureLink = this.renderAddMeasureLink();

    return (
      <div>
        <ul className="measure-list">
          {measureSelectors}
          {pendingMeasureSelector}
        </ul>
        {addMeasureLink}
      </div>
    );
  }

  renderPendingMeasureSelector(options) {
    const { vifAuthoring } = this.props;
    const seriesIndex = getSeries(vifAuthoring).length;

    const measureListItemAttributes = {
      className: 'measure-list-item',
      key: seriesIndex
    };

    const hasOnlyDefaultValue = options.length <= 1;
    const measureAttributes = {
      disabled: isFeatureMap(vifAuthoring) || hasOnlyDefaultValue,
      id: `measure-selection-${seriesIndex}`,
      onSelection: (option) => this.handleOnSelectionPendingMeasureColumn(option),
      options,
      placeholder: I18n.translate('shared.visualizations.panes.data.fields.measure.select_column')
    };

    const deleteMeasureLink = this.renderDeletePendingMeasureLink();

    return (
      <li {...measureListItemAttributes}>
        <div className="measure-column-selector-dropdown-container">
          <Dropdown {...measureAttributes} />
        </div>
        {deleteMeasureLink}
      </li>
    );
  }

  renderMeasureSelector(seriesItem, options) {
    const { vifAuthoring } = this.props;

    const measureListItemAttributes = {
      className: 'measure-list-item',
      key: seriesItem.seriesIndex
    };

    const hasOnlyDefaultValue = options.length <= 1;
    const measureAttributes = {
      disabled: isFeatureMap(vifAuthoring) || hasOnlyDefaultValue,
      id: `measure-selection-${seriesItem.seriesIndex}`,
      onSelection: (option) => this.handleOnSelectionMeasureColumn(seriesItem.seriesIndex, option),
      options,
      value: seriesItem.dataSource.measure.columnName
    };

    const measureAggregationSelector = this.renderMeasureAggregationSelector(seriesItem);
    const allSeries = getSeries(vifAuthoring);
    const deleteMeasureLink = (allSeries.length > 1) ?
      this.renderDeleteMeasureLink(seriesItem.seriesIndex) :
      null;

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

  renderMeasureAggregationSelector(seriesItem) {
    const { aggregationTypes, vifAuthoring } = this.props;

    if (_.isNull(seriesItem.dataSource.measure.columnName)) {
      return null; // no aggregation dropdown when no column name is selected
    }

    const options = [
      { title: I18n.translate('shared.visualizations.aggregations.none'), value: null },
      ...aggregationTypes.map(aggregationType => ({ title: aggregationType.title, value: aggregationType.type }))
    ];

    const measureAggregationAttributes = {
      disabled: isFeatureMap(vifAuthoring),
      id: `measure-aggregation-selection-${seriesItem.seriesIndex}`,
      onSelection: (option) => this.handleOnSelectionMeasureAggregation(seriesItem.seriesIndex, option),
      options,
      value: seriesItem.dataSource.measure.aggregationFunction
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
    const attributes = {
      className: 'measure-delete-link',
      id: `measure-delete-link-${seriesIndex}`,
      onClick: () => this.handleOnClickDeleteMeasure(seriesIndex)
    };

    return (
      <div className="measure-delete-link-container">
        <a {...attributes}>
          <span className="socrata-icon-close" />
        </a>
      </div>
    );
  }

  renderDeletePendingMeasureLink() {
    const attributes = {
      className: 'measure-delete-link',
      onClick: () => this.handleOnClickDeletePendingMeasure()
    };

    return (
      <div className="measure-delete-link-container">
        <a {...attributes}>
          <span className="socrata-icon-close" />
        </a>
      </div>
    );
  }

  renderAddMeasureLink() {
    const { series, vifAuthoring } = this.props;
    const { isSeriesPending } = this.state;

    const maximumMeasures = isComboChart(vifAuthoring) ?
      MAXIMUM_COMBO_CHART_MEASURES :
      MAXIMUM_MEASURES;

    const shouldRender = (series.length < maximumMeasures) &&
      (isBarChart(vifAuthoring) || isColumnChart(vifAuthoring) || isTimelineChart(vifAuthoring) || isComboChart(vifAuthoring));

    const isDisabled = isSeriesPending ||
      !_.isEmpty(getDimensionGroupingColumnName(vifAuthoring)) ||
      hasErrorBars(vifAuthoring);

    const addMeasureLinkAttributes = {
      id: 'measure-add-measure-link',
      className: isDisabled ? 'disabled' : null,
      onClick: isDisabled ? null : () => this.handleOnClickAddMeasure()
    };

    return shouldRender ? (
      <div className="measure-add-measure-link-container">
        <a {...addMeasureLinkAttributes}>
          <span className="socrata-icon-add" />
          {I18n.translate('shared.visualizations.panes.data.fields.measure.add_measure')}
        </a>
      </div>
    ) : null;
  }

  render() {
    const shouldRender = hasData(this.props.metadata);
    return shouldRender ? this.renderMeasureSelectors() : null;
  }
}

MeasureSelector.propTypes = {
  metadata: PropTypes.object,
  onAddMeasure: PropTypes.func,
  onRemoveMeasure: PropTypes.func,
  onSetMeasureAggregation: PropTypes.func,
  onSetMeasureColumn: PropTypes.func,
  onSetSeriesType: PropTypes.func,
  series: PropTypes.arrayOf(PropTypes.object),
  seriesType: PropTypes.string,
  vifAuthoring: PropTypes.object
};

MeasureSelector.defaultProps = { aggregationTypes: AGGREGATION_TYPES };

function mapDispatchToProps(dispatch) {
  return {
    onAddMeasure(seriesIndex) {
      dispatch(
        appendSeries({
          isInitialLoad: false,
          seriesIndex
        })
      );
    },

    onRemoveMeasure(seriesIndex) {
      dispatch(removeSeries(seriesIndex));
    },

    onSetMeasureAggregation(seriesIndex, aggregationFunction) {
      dispatch(setMeasureAggregation(seriesIndex, aggregationFunction));
    },

    onSetMeasureColumn(seriesIndex, columnName) {
      dispatch(setMeasure(seriesIndex, columnName));
    },

    onSetSeriesType(seriesIndex, seriesType) {
      dispatch(setSeriesType(seriesIndex, seriesType));
    }
  };
}

function mapStateToProps(state) {
  return _.pick(state, ['metadata', 'vifAuthoring']);
}

export default connect(mapStateToProps, mapDispatchToProps)(MeasureSelector);
