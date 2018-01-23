import _ from 'lodash';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { factories, Dropdown } from 'common/components';
import I18n from 'common/i18n';
import {
  AGGREGATION_TYPES,
  COLUMN_TYPES,
  MAXIMUM_MEASURES,
  MAXIMUM_COMBO_CHART_MEASURES
} from '../constants';

import {
  appendSeries,
  removeSeries,
  setMeasureAggregation,
  setMeasureColumn
} from '../actions';

import {
  getDimensionGroupingColumnName,
  getSeries,
  hasErrorBars,
  isComboChart,
  isFeatureMap,
  getPointAggregation,
  getDimension
} from '../selectors/vifAuthoring';

import {
  hasData,
  getValidMeasures,
  isPointMapColumn
} from '../selectors/metadata';

import { FeatureFlags } from 'common/feature_flags';

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

  getListItemKey(seriesIndex) {
    return `${this.props.listItemKeyPrefix}:${seriesIndex}`;
  }

  handleOnClickAddMeasure() {
    this.setState({ isSeriesPending: true });
  }

  handleOnClickDeleteMeasure(seriesIndex, measureIndex) {
    const { isFlyoutSeries, onRemoveSeries } = this.props;

    onRemoveSeries(
      isFlyoutSeries,
      isFlyoutSeries ? measureIndex : seriesIndex
    );
  }

  handleOnClickDeletePendingMeasure() {
    this.setState({ isSeriesPending: false });
  }

  handleOnSelectionMeasureAggregation(seriesIndex, measureIndex, option) {
    const { isFlyoutSeries, onSetMeasureAggregation } = this.props;

    onSetMeasureAggregation(
      isFlyoutSeries,
      isFlyoutSeries ? measureIndex : seriesIndex,
      option.value
    );
  }

  handleOnSelectionMeasureColumn(seriesIndex, measureIndex, option) {
    const { isFlyoutSeries, onSetMeasureColumn } = this.props;

    onSetMeasureColumn(
      isFlyoutSeries,
      isFlyoutSeries ? measureIndex : seriesIndex,
      option.value
    );
  }

  handleOnSelectionPendingMeasureColumn(seriesIndex, measureIndex, option) {
    const { isFlyoutSeries, onAppendSeries, seriesVariant } = this.props;

    onAppendSeries(isFlyoutSeries, seriesVariant, option.value);

    this.setState({ isSeriesPending: false });
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

    const measureSelectors = series.map((seriesItem, measureIndex) => {
      return this.renderMeasureSelector(seriesItem, measureIndex, options);
    });

    const measureIndex = measureSelectors.length;
    const pendingMeasureSelector = isSeriesPending ?
      this.renderPendingMeasureSelector(options, measureIndex) :
      null;

    const addMeasureLink = this.renderAddMeasureLink();

    return (
      <div>
        <ul className="dropdowns-list">
          {measureSelectors}
          {pendingMeasureSelector}
        </ul>
        {addMeasureLink}
      </div>
    );
  }

  renderPendingMeasureSelector(options, measureIndex) {
    const { vifAuthoring, metadata } = this.props;
    const dimension = getDimension(vifAuthoring);
    const seriesIndex = getSeries(vifAuthoring).length;
    const measureListItemAttributes = {
      className: 'list-item',
      key: this.getListItemKey(seriesIndex)
    };
    const isNewGLMapEnabled = FeatureFlags.value('enable_new_maps');
    const disabled = options.length <= 1 ||
      isFeatureMap(vifAuthoring) ||
      (isNewGLMapEnabled &&
        isPointMapColumn(metadata, dimension) &&
        getPointAggregation(vifAuthoring) !== 'region_map');
    const measureAttributes = {
      disabled,
      id: `measure-selection-${seriesIndex}`,
      onSelection: (option) => this.handleOnSelectionPendingMeasureColumn(seriesIndex, measureIndex, option),
      options,
      placeholder: I18n.translate('shared.visualizations.panes.data.fields.measure.select_column')
    };
    const deleteMeasureLink = this.renderDeletePendingMeasureLink();

    return (
      <li {...measureListItemAttributes}>
        <div className="primary-dropdown-container">
          <Dropdown {...measureAttributes} />
        </div>
        {deleteMeasureLink}
      </li>
    );
  }

  renderMeasureSelector(seriesItem, measureIndex, options) {
    const { shouldRenderDeleteMeasureLink, vifAuthoring, metadata } = this.props;
    const dimension = getDimension(vifAuthoring);
    const measureListItemAttributes = {
      className: 'list-item',
      key: this.getListItemKey(seriesItem.seriesIndex)
    };
    const isNewGLMapEnabled = FeatureFlags.value('enable_new_maps');
    const disabled = options.length <= 1 ||
      isFeatureMap(vifAuthoring) ||
      (isNewGLMapEnabled &&
        isPointMapColumn(metadata, dimension) &&
        getPointAggregation(vifAuthoring) !== 'region_map');
    const measureAttributes = {
      disabled,
      id: `measure-selection-${seriesItem.seriesIndex}`,
      onSelection: (option) => {
        this.handleOnSelectionMeasureColumn(seriesItem.seriesIndex, measureIndex, option);
      },
      options,
      value: seriesItem.dataSource.measure.columnName
    };
    const measureAggregationSelector = this.renderMeasureAggregationSelector(seriesItem, measureIndex);
    const allSeries = getSeries(vifAuthoring);
    const deleteMeasureLink = shouldRenderDeleteMeasureLink ?
      this.renderDeleteMeasureLink(seriesItem.seriesIndex, measureIndex) :
      null;

    return (
      <li {...measureListItemAttributes}>
        <div className="primary-dropdown-container">
          <Dropdown {...measureAttributes} />
        </div>
        {measureAggregationSelector}
        {deleteMeasureLink}
      </li>
    );
  }

  renderMeasureAggregationSelector(seriesItem, measureIndex) {
    const { aggregationTypes, vifAuthoring, metadata } = this.props;
    const dimension = getDimension(vifAuthoring);

    if (_.isNull(seriesItem.dataSource.measure.columnName)) {
      return null; // no aggregation dropdown when no column name is selected
    }

    const options = [
      ...aggregationTypes.map(aggregationType => ({ title: aggregationType.title, value: aggregationType.type })),
      { title: I18n.translate('shared.visualizations.aggregations.none'), value: null }
    ];
    const isNewGLMapEnabled = FeatureFlags.value('enable_new_maps');
    const disabled = options.length <= 1 ||
      isFeatureMap(vifAuthoring) ||
      (isNewGLMapEnabled &&
        isPointMapColumn(metadata, dimension) &&
        getPointAggregation(vifAuthoring) !== 'region_map');
    const measureAggregationAttributes = {
      disabled,
      id: `measure-aggregation-selection-${seriesItem.seriesIndex}`,
      onSelection: (option) => {
        this.handleOnSelectionMeasureAggregation(seriesItem.seriesIndex, measureIndex, option);
      },
      options,
      value: seriesItem.dataSource.measure.aggregationFunction
    };

    return (
      <div className="secondary-dropdown-container">
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

  renderDeleteMeasureLink(seriesIndex, measureIndex) {
    const attributes = {
      className: 'delete-link',
      id: `measure-delete-link-${seriesIndex}`,
      onClick: () => this.handleOnClickDeleteMeasure(seriesIndex, measureIndex)
    };

    return (
      <div className="delete-link-container">
        <a {...attributes}>
          <span className="socrata-icon-close" />
        </a>
      </div>
    );
  }

  renderDeletePendingMeasureLink() {
    const attributes = {
      className: 'delete-link',
      onClick: () => this.handleOnClickDeletePendingMeasure()
    };

    return (
      <div className="delete-link-container">
        <a {...attributes}>
          <span className="socrata-icon-close" />
        </a>
      </div>
    );
  }

  renderAddMeasureLink() {
    const {
      isFlyoutSeries,
      series,
      seriesVariant,
      shouldRenderAddMeasureLink,
      vifAuthoring
    } = this.props;

    const { isSeriesPending } = this.state;

    const maximumMeasures = isComboChart(vifAuthoring) ?
      MAXIMUM_COMBO_CHART_MEASURES :
      MAXIMUM_MEASURES;

    const shouldRender = (series.length < maximumMeasures) && shouldRenderAddMeasureLink;

    const isDisabled = isSeriesPending ||
      !_.isEmpty(getDimensionGroupingColumnName(vifAuthoring)) ||
      (hasErrorBars(vifAuthoring) && !isFlyoutSeries);

    const addMeasureLinkAttributes = {
      id: 'measure-add-measure-link',
      className: isDisabled ? 'disabled' : null,
      onClick: isDisabled ? null : () => this.handleOnClickAddMeasure()
    };

    const title = isFlyoutSeries ?
      I18n.translate('shared.visualizations.panes.data.fields.flyout_measure.add_flyout_value') :
      I18n.translate('shared.visualizations.panes.data.fields.measure.add_measure');

    return shouldRender ? (
      <div className="add-link-container">
        <a {...addMeasureLinkAttributes}>
          <span className="socrata-icon-add" />
          {title}
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
  isFlyoutSeries: PropTypes.bool,
  listItemKeyPrefix: PropTypes.string,
  metadata: PropTypes.object,
  onAppendSeries: PropTypes.func,
  onRemoveSeries: PropTypes.func,
  onSetMeasureAggregation: PropTypes.func,
  onSetMeasureColumn: PropTypes.func,
  series: PropTypes.arrayOf(PropTypes.object),
  seriesVariant: PropTypes.string,
  shouldRenderAddMeasureLink: PropTypes.bool,
  shouldRenderDeleteMeasureLink: PropTypes.bool,
  vifAuthoring: PropTypes.object
};

MeasureSelector.defaultProps = { aggregationTypes: AGGREGATION_TYPES };

function mapDispatchToProps(dispatch) {
  return {
    onAppendSeries(isFlyoutSeries, seriesVariant, measureColumnName) {
      dispatch(appendSeries({
        isFlyoutSeries,
        isInitialLoad: false,
        measureColumnName,
        seriesVariant
      }));
    },

    onRemoveSeries(isFlyoutSeries, relativeIndex) {
      dispatch(removeSeries({
        isFlyoutSeries,
        relativeIndex
      }));
    },

    onSetMeasureAggregation(isFlyoutSeries, relativeIndex, aggregationFunction) {
      dispatch(setMeasureAggregation({
        aggregationFunction,
        isFlyoutSeries,
        relativeIndex
      }));
    },

    onSetMeasureColumn(isFlyoutSeries, relativeIndex, columnName) {
      dispatch(setMeasureColumn({
        columnName,
        isFlyoutSeries,
        relativeIndex
      }));
    }
  };
}

function mapStateToProps(state) {
  return _.pick(state, ['metadata', 'vifAuthoring']);
}

export default connect(mapStateToProps, mapDispatchToProps)(MeasureSelector);
