import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Dropdown, AccordionContainer, AccordionPane } from 'common/components';
import I18n from 'common/i18n';
import { COLUMN_TYPES, SERIES_TYPE_FLYOUT } from '../../constants';
import { getMeasureTitle } from '../../helpers';
import { getDisplayableColumns, hasData, isPointMapColumn } from '../../selectors/metadata';

import {
  getNonFlyoutSeries,
  getRowInspectorTitleColumnName,
  getMapFlyoutTitleColumnName,
  getSeries,
  getShowLegend,
  getDimension,
  getPointAggregation,
  getShowLegendOpened,
  getVisualizationType,
  hasReferenceLineLabels,
  isBarChart,
  isColumnChart,
  isComboChart,
  isFeatureMap,
  isGrouping,
  isGroupingOrHasMultipleNonFlyoutSeries,
  isHistogram,
  isPieChart,
  isRegionMap,
  isTimelineChart,
  isNewGLMap
} from '../../selectors/vifAuthoring';

import {
  setRowInspectorTitleColumnName,
  setMapFlyoutTitleColumnName,
  setShowLegend,
  setShowLegendOpened,
  setUnitsOne,
  setUnitsOther
} from '../../actions';

import CustomizationTabPane from '../CustomizationTabPane';
import DebouncedInput from '../shared/DebouncedInput';
import EmptyPane from './EmptyPane';
import MeasureSelector from '../MeasureSelector';
import ColumnSelector from '../ColumnSelector';

export class LegendsAndFlyoutsPane extends Component {
  renderFlyoutUnits = () => {
    const { vifAuthoring, onChangeUnitOne, onChangeUnitOther, metadata } = this.props;

    const nonFlyoutSeries = getNonFlyoutSeries(vifAuthoring);

    const isNewGLMapEnabled = isNewGLMap(vifAuthoring);

    const unitControls = nonFlyoutSeries.map((item, index) => {

      const hasSumAggregation = (item.dataSource.measure.aggregationFunction == 'sum');

      const unitOne = _.get(item, 'unit.one', '');

      const unitOther = _.get(item, 'unit.other', '');

      let unitsOnePlaceholderKey = 'units_one.placeholder';
      let unitsOtherPlaceholderKey = 'units_other.placeholder';

      if (isNewGLMapEnabled) {
        unitsOnePlaceholderKey = 'placeholders.point';
        unitsOtherPlaceholderKey = 'placeholders.points';
      } else if (hasSumAggregation) {
        unitsOnePlaceholderKey = 'sum_aggregation_unit';
        unitsOtherPlaceholderKey = 'sum_aggregation_unit';
      }

      const unitOneAttributes = {
        id: `units-one-${index}`,
        className: 'text-input',
        type: 'text',
        onChange: (event) => onChangeUnitOne(index, event.target.value),
        placeholder: I18n.t(unitsOnePlaceholderKey, {
          scope: 'shared.visualizations.panes.legends_and_flyouts.fields'
        }),
        value: unitOne
      };

      const unitOtherAttributes = {
        id: `units-other-${index}`,
        className: 'text-input',
        type: 'text',
        onChange: (event) => onChangeUnitOther(index, event.target.value),
        placeholder: I18n.t(unitsOtherPlaceholderKey, {
          scope: 'shared.visualizations.panes.legends_and_flyouts.fields'
        }),
        value: unitOther
      };

      const measureTitle = isNewGLMapEnabled ? null : getMeasureTitle(metadata, item);
      return this.renderFlyoutUnitsForSeries(index, measureTitle, unitOneAttributes, unitOtherAttributes);
    });
    const flyoutUnitsDescriptionKey = isNewGLMapEnabled ? 'description_for_maps' : 'description';

    return (
      <AccordionPane
        key="units"
        title={I18n.t('shared.visualizations.panes.legends_and_flyouts.subheaders.flyout_units.title')}>
        <p className="authoring-field-description units-description">
          <small>
            {I18n.t(flyoutUnitsDescriptionKey, {
              scope: 'shared.visualizations.panes.legends_and_flyouts.subheaders.flyout_units'
            })}
          </small>
        </p>
        {unitControls}
      </AccordionPane>
    );
  }

  renderFlyoutUnitsForSeries = (seriesIndex, measureTitle, unitOneAttributes, unitOtherAttributes) => {
    const containerAttributes = {
      id: `units-container-${seriesIndex}`,
      className: 'units-container',
      key: seriesIndex
    };

    const unitsOneLabelAttributes = {
      className: 'block-label',
      htmlFor: `units-one-${seriesIndex}`
    };

    const unitsOtherLabelAttributes = {
      className: 'block-label',
      htmlFor: `units-other-${seriesIndex}`
    };

    return (
      <div {...containerAttributes}>
        {_.isNull(measureTitle) ? null : <p>{measureTitle}</p>}
        <div className="authoring-field unit-container">
          <label {...unitsOneLabelAttributes}>{I18n.t('shared.visualizations.panes.legends_and_flyouts.fields.units_one.title')}</label>
          <DebouncedInput {...unitOneAttributes} />
        </div>
        <div className="authoring-field unit-container">
          <label {...unitsOtherLabelAttributes}>{I18n.t('shared.visualizations.panes.legends_and_flyouts.fields.units_other.title')}</label>
          <DebouncedInput {...unitOtherAttributes} />
        </div>
      </div>
    );
  }

  renderFlyoutDetails = () => {
    const { vifAuthoring } = this.props;

    if (isGrouping(vifAuthoring)) {
      return null;
    }

    const series = getSeries(vifAuthoring).map((item, index) => {
      return _.extend({ seriesIndex: index }, item);
    });

    const flyoutSeries = _.filter(series, (item) => {
      return item.type === SERIES_TYPE_FLYOUT;
    });

    const attributes = {
      isFlyoutSeries: true,
      listItemKeyPrefix: 'LegendsAndFlyoutsPane',
      series: flyoutSeries,
      shouldRenderAddMeasureLink: true,
      shouldRenderDeleteMeasureLink: true
    };

    return (
      <AccordionPane
        key="details"
        title={I18n.t('shared.visualizations.panes.legends_and_flyouts.subheaders.flyout_details.title')}>
        <MeasureSelector {...attributes} />
      </AccordionPane>
    );
  }

  renderFlyoutDetailsForMaps = () => {
    const attributes = {
      listItemKeyPrefix: 'AdditionalFlyoutValues',
      shouldRenderAddColumnLink: true,
      shouldRenderDeleteColumnLink: true
    };

    return (
      <AccordionPane
        key="details"
        title={I18n.t('shared.visualizations.panes.legends_and_flyouts.subheaders.flyout_details.title')}>
        {this.renderFlyoutTitle()}
        <label>
          {I18n.translate('additional_flyout_values', {
            scope: 'shared.visualizations.panes.legends_and_flyouts.subheaders'
          })}
        </label>
        <ColumnSelector {...attributes} />
      </AccordionPane>
    );
  }

  renderLegends = () => {
    const { onChangeShowLegend, onChangeShowLegendOpened, vifAuthoring } = this.props;

    // Currently legends are only available for grouping or multi-series visualizations or pie charts
    const isCurrentlyPieChart = isPieChart(vifAuthoring);

    if (!isGroupingOrHasMultipleNonFlyoutSeries(vifAuthoring) && !isCurrentlyPieChart && !hasReferenceLineLabels(vifAuthoring)) {
      return null;
    }

    // Pie charts default to showing the legend
    const defaultValue = isCurrentlyPieChart;
    const showLegend = getShowLegend(defaultValue)(vifAuthoring);
    const showLegendOpened = getShowLegendOpened(vifAuthoring);
    const scope = 'shared.visualizations.panes.legends_and_flyouts.fields';

    const showLegendOpenedCheckbox = !isPieChart(vifAuthoring) ? (
      <div className="authoring-field checkbox">
        <input id="show-legends-opened" type="checkbox" onChange={onChangeShowLegendOpened} defaultChecked={showLegendOpened} />
        <label className="inline-label" htmlFor="show-legends-opened">
          <span className="fake-checkbox">
            <span className="icon-checkmark3"></span>
          </span>
          {I18n.t('show_legend_opened.title', { scope })}
        </label>
      </div>
    ) : null;

    return (
      <AccordionPane key="legends" title={I18n.t('shared.visualizations.panes.legends_and_flyouts.subheaders.legends.title')}>
        <div className="authoring-field checkbox">
          <input id="show-legends" type="checkbox" onChange={onChangeShowLegend} defaultChecked={showLegend} />
          <label className="inline-label" htmlFor="show-legends">
            <span className="fake-checkbox">
              <span className="icon-checkmark3"></span>
            </span>
            {I18n.t('show_legend.title', { scope })}
          </label>
        </div>
        {showLegendOpenedCheckbox}
      </AccordionPane>
    );
  }

  renderFlyoutTitle = () => {
    const { onSelectMapsFlyoutTitle, vifAuthoring, metadata } = this.props;
    const mapFlyoutTitleColumnName = getMapFlyoutTitleColumnName(vifAuthoring);
    const scope = 'shared.visualizations.panes.legends_and_flyouts.fields.maps_flyout_title';
    const columnOptions = _.map(getDisplayableColumns(metadata), column => ({
      title: column.name,
      value: column.fieldName,
      type: column.renderTypeName,
      render: this.renderColumnOption
    }));
    const options = [
      {
        title: I18n.t('no_value', { scope }),
        value: null
      },
      ...columnOptions
    ];
    const columnAttributes = {
      id: 'flyout-title-column',
      placeholder: I18n.t('no_value', { scope }),
      options,
      value: mapFlyoutTitleColumnName,
      onSelection: onSelectMapsFlyoutTitle
    };

    return (
      <div className="authoring-field">
        <label className="block-label" htmlFor="flyout-title-column">
          {I18n.t('title', { scope })}
        </label>
        <div className="flyout-title-dropdown-container">
          <Dropdown {...columnAttributes} />
        </div>
      </div>
    );
  }

  renderBarChartControls = () => {
    return [this.renderFlyoutUnits(), this.renderFlyoutDetails(), this.renderLegends()];
  }

  renderColumnChartControls = () => {
    return [this.renderFlyoutUnits(), this.renderFlyoutDetails(), this.renderLegends()];
  }

  renderComboChartControls = () => {
    return [this.renderFlyoutUnits(), this.renderFlyoutDetails(), this.renderLegends()];
  }

  renderHistogramControls = () => {
    return [this.renderFlyoutUnits(), this.renderLegends()];
  }

  renderPieChartControls = () => {
    return [this.renderFlyoutUnits(), this.renderFlyoutDetails(), this.renderLegends()];
  }

  renderRegionMapControls = () => {
    return this.renderFlyoutUnits();
  }

  renderTimelineChartControls = () => {
    return [this.renderFlyoutUnits(), this.renderFlyoutDetails(), this.renderLegends()];
  }

  renderNewGLMapControls = () => {
    const { vifAuthoring, metadata } = this.props;
    const selectedPointAggregation = getPointAggregation(vifAuthoring);
    const dimension = getDimension(vifAuthoring);
    const isPointMap = isPointMapColumn(metadata, dimension);

    if (isPointMap && selectedPointAggregation !== 'none') {
      return this.renderEmptyPane();
    }

    return [this.renderFlyoutUnits(), this.renderFlyoutDetailsForMaps()];
  }

  renderFeatureMapControls = () => {
    const { onSelectRowInspectorTitle, vifAuthoring, metadata } = this.props;
    const rowInspectorTitleColumnName = getRowInspectorTitleColumnName(vifAuthoring);
    const columnAttributes = {
      id: 'flyout-title-column',
      placeholder: I18n.t('shared.visualizations.panes.legends_and_flyouts.fields.row_inspector_title.no_value'),
      options: _.map(getDisplayableColumns(metadata), column => ({
        title: column.name,
        value: column.fieldName,
        type: column.renderTypeName,
        render: this.renderColumnOption
      })),
      onSelection: onSelectRowInspectorTitle,
      value: rowInspectorTitleColumnName
    };

    const rowInspector = (
      <AccordionPane key="rowInspector" title={I18n.t('shared.visualizations.panes.legends_and_flyouts.subheaders.row_inspector_title')}>
        <div className="authoring-field">
          <label className="block-label" htmlFor="flyout-title-column">Column</label>
          <div className="flyout-title-dropdown-container">
            <Dropdown {...columnAttributes} />
          </div>
        </div>
      </AccordionPane>
    );

    return [this.renderFlyoutUnits(), rowInspector];
  }

  renderColumnOption = (option) => {
    const columnType = _.find(COLUMN_TYPES, { type: option.type });
    const icon = columnType ? columnType.icon : '';

    return (
      <div className="dataset-column-selector-option">
        <span className={icon}></span> {option.title}
      </div>
    );
  }

  renderEmptyPane = () => {
    return <EmptyPane />;
  }

  render() {
    let configuration;
    const { metadata, vifAuthoring } = this.props;

    if (hasData(metadata)) {
      if (isBarChart(vifAuthoring)) {
        configuration = this.renderBarChartControls();
      } else if (isPieChart(vifAuthoring)) {
        configuration = this.renderPieChartControls();
      } else if (isRegionMap(vifAuthoring)) {
        configuration = this.renderRegionMapControls();
      } else if (isNewGLMap(vifAuthoring)) {
        configuration = this.renderNewGLMapControls();
      } else if (isColumnChart(vifAuthoring)) {
        configuration = this.renderColumnChartControls();
      } else if (isComboChart(vifAuthoring)) {
        configuration = this.renderComboChartControls();
      } else if (isHistogram(vifAuthoring)) {
        configuration = this.renderHistogramControls();
      } else if (isFeatureMap(vifAuthoring)) {
        configuration = this.renderFeatureMapControls();
      } else if (isTimelineChart(vifAuthoring)) {
        configuration = this.renderTimelineChartControls();
      } else {
        configuration = this.renderEmptyPane();
      }

      return (
        <form>
          <AccordionContainer>
            {configuration}
          </AccordionContainer>
        </form>
      );
    } else {
      return null;
    }
  }
}

LegendsAndFlyoutsPane.propTypes = {
  onChangeUnitOne: PropTypes.func,
  onChangeUnitOther: PropTypes.func,
  vifAuthoring: PropTypes.object
};

function mapStateToProps(state) {
  return {
    vifAuthoring: state.vifAuthoring,
    metadata: state.metadata
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onChangeUnitOne: (seriesIndex, unitOne) => {
      dispatch(setUnitsOne(seriesIndex, unitOne));
    },

    onChangeUnitOther: (seriesIndex, unitOther) => {
      dispatch(setUnitsOther(seriesIndex, unitOther));
    },

    onSelectRowInspectorTitle: flyoutTitle => {
      const columnName = flyoutTitle.value;
      dispatch(setRowInspectorTitleColumnName(columnName));
    },

    onSelectMapsFlyoutTitle: (flyoutTitle) => {
      const columnName = flyoutTitle.value;
      dispatch(setMapFlyoutTitleColumnName(columnName));
    },

    onChangeShowLegend: (e) => {
      dispatch(setShowLegend(e.target.checked));
    },

    onChangeShowLegendOpened: (e) => {
      dispatch(setShowLegendOpened(e.target.checked));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(LegendsAndFlyoutsPane);
