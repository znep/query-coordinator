import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Dropdown, AccordionContainer, AccordionPane } from 'common/components';
import I18n from 'common/i18n';
import { COLUMN_TYPES, SERIES_TYPE_FLYOUT } from '../../constants';
import { getMeasureTitle } from '../../helpers';
import { getDisplayableColumns, hasData } from '../../selectors/metadata';

import {
  getNonFlyoutSeries,
  getRowInspectorTitleColumnName,
  getSeries,
  getShowLegend,
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
  setShowLegend,
  setUnitsOne,
  setUnitsOther
} from '../../actions';

import CustomizationTabPane from '../CustomizationTabPane';
import DebouncedInput from '../shared/DebouncedInput';
import EmptyPane from './EmptyPane';
import MeasureSelector from '../MeasureSelector';

export class LegendsAndFlyoutsPane extends Component {
  renderFlyoutUnits = () => {
    const { vifAuthoring, onChangeUnitOne, onChangeUnitOther, metadata } = this.props;

    const nonFlyoutSeries = getNonFlyoutSeries(vifAuthoring);
    const unitControls = nonFlyoutSeries.map((item, index) => {

      const hasSumAggregation = (item.dataSource.measure.aggregationFunction == 'sum');
      const unitOne = _.get(item, 'unit.one', '');
      const unitOther = _.get(item, 'unit.other', '');

      const unitOneAttributes = {
        id: `units-one-${index}`,
        className: 'text-input',
        type: 'text',
        onChange: (event) => onChangeUnitOne(index, event.target.value),
        placeholder: hasSumAggregation ?
          I18n.t('shared.visualizations.panes.legends_and_flyouts.fields.sum_aggregation_unit') :
          I18n.t('shared.visualizations.panes.legends_and_flyouts.fields.units_one.placeholder'),
        value: unitOne
      };

      const unitOtherAttributes = {
        id: `units-other-${index}`,
        className: 'text-input',
        type: 'text',
        onChange: (event) => onChangeUnitOther(index, event.target.value),
        placeholder: hasSumAggregation ?
          I18n.t('shared.visualizations.panes.legends_and_flyouts.fields.sum_aggregation_unit') :
          I18n.t('shared.visualizations.panes.legends_and_flyouts.fields.units_other.placeholder'),
        value: unitOther
      };

      const measureTitle = getMeasureTitle(metadata, item);
      return this.renderFlyoutUnitsForSeries(index, measureTitle, unitOneAttributes, unitOtherAttributes);
    });

    return (
      <AccordionPane key="units" title={I18n.t('shared.visualizations.panes.legends_and_flyouts.subheaders.flyout_units.title')}>
        <p className="authoring-field-description units-description">
          <small>{I18n.t('shared.visualizations.panes.legends_and_flyouts.subheaders.flyout_units.description')}</small>
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
        <p>{measureTitle}</p>
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
      <AccordionPane key="details" title={I18n.t('shared.visualizations.panes.legends_and_flyouts.subheaders.flyout_details.title')}>
        <MeasureSelector {...attributes} />
      </AccordionPane>
    );
  }

  renderLegends = () => {
    const { vifAuthoring, onChangeShowLegend } = this.props;

    // Currently legends are only available for grouping or multi-series visualizations or pie charts
    const isCurrentlyPieChart = isPieChart(vifAuthoring);

    if (!isGroupingOrHasMultipleNonFlyoutSeries(vifAuthoring) && !isCurrentlyPieChart && !hasReferenceLineLabels(vifAuthoring)) {
      return null;
    }

    // Pie charts default to showing the legend
    const defaultValue = isCurrentlyPieChart;
    const showLegend = getShowLegend(defaultValue)(vifAuthoring);

    return (
      <AccordionPane key="legends" title={I18n.t('shared.visualizations.panes.legends_and_flyouts.subheaders.legends.title')}>
        <div className="authoring-field checkbox">
          <input id="show-legends" type="checkbox" onChange={onChangeShowLegend} defaultChecked={showLegend} />
          <label className="inline-label" htmlFor="show-legends">
            <span className="fake-checkbox">
              <span className="icon-checkmark3"></span>
            </span>
            {I18n.t('shared.visualizations.panes.legends_and_flyouts.fields.show_legends.title')}
          </label>
        </div>
      </AccordionPane>
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
        render: this.renderRowInspectorTitleColumnOption
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

  renderNewMapControls = () => {
    return this.renderFeatureMapControls();
  }

  renderRowInspectorTitleColumnOption = (option) => {
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
        configuration = this.renderNewMapControls();
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

    onChangeShowLegend: (e) => {
      dispatch(setShowLegend(e.target.checked));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(LegendsAndFlyoutsPane);
