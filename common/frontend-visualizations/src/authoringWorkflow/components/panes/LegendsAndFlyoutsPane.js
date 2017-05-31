import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import Styleguide from 'socrata-components';
import { FeatureFlags } from 'socrata-utils';

import { translate } from '../../../I18n';
import { COLUMN_TYPES } from '../../constants';
import { getDisplayableColumns, hasData } from '../../selectors/metadata';
import {
  getRowInspectorTitleColumnName,
  getUnitOne,
  getUnitOther,
  getDimensionGroupingColumnName,
  getShowLegend,
  isBarChart,
  isPieChart,
  isRegionMap,
  isColumnChart,
  isFeatureMap,
  isHistogram,
  isTimelineChart
} from '../../selectors/vifAuthoring';

import {
  setRowInspectorTitleColumnName,
  setShowLegend,
  setUnitsOne,
  setUnitsOther
} from '../../actions';

import CustomizationTabPane from '../CustomizationTabPane';
import EmptyPane from './EmptyPane';
import Accordion from '../shared/Accordion';
import AccordionPane from '../shared/AccordionPane';
import DebouncedInput from '../shared/DebouncedInput';

export const LegendsAndFlyoutsPane = React.createClass({
  propTypes: {
    onChangeUnitOne: React.PropTypes.func,
    onChangeUnitOther: React.PropTypes.func,
    vifAuthoring: React.PropTypes.object
  },

  renderUnits() {
    const { vifAuthoring, onChangeUnitOne, onChangeUnitOther } = this.props;
    const unitOne = getUnitOne(vifAuthoring);
    const unitOneAttributes = {
      id: 'units-one',
      className: 'text-input',
      type: 'text',
      onChange: onChangeUnitOne,
      placeholder: translate('panes.legends_and_flyouts.fields.units_one.placeholder'),
      value: unitOne
    };

    const unitOther = getUnitOther(vifAuthoring);
    const unitOtherAttributes = {
      id: 'units-other',
      className: 'text-input',
      type: 'text',
      onChange: onChangeUnitOther,
      placeholder: translate('panes.legends_and_flyouts.fields.units_other.placeholder'),
      value: unitOther
    };

    return (
      <AccordionPane key="units" title={translate('panes.legends_and_flyouts.subheaders.units.title')}>
        <p className="authoring-field-description">
          <small>{translate('panes.legends_and_flyouts.subheaders.units.description')}</small>
        </p>
        <div className="authoring-field">
          <label className="block-label"
                 htmlFor="units-one">{translate('panes.legends_and_flyouts.fields.units_one.title')}</label>
          <DebouncedInput {...unitOneAttributes} />
        </div>
        <div className="authoring-field">
          <label className="block-label"
                 htmlFor="units-other">{translate('panes.legends_and_flyouts.fields.units_other.title')}</label>
          <DebouncedInput {...unitOtherAttributes} />
        </div>
      </AccordionPane>
    );
  },

  renderLegends() {
    const { vifAuthoring, onChangeShowLegend } = this.props;

    if (!FeatureFlags.value('visualization_authoring_enable_column_chart_legend')) {
      return null;
    }

    // Currently legends are only available for grouping visualizations
    const isGrouping = getDimensionGroupingColumnName(vifAuthoring);
    if (!isGrouping) {
      return null;
    }

    const showLegend = getShowLegend(vifAuthoring);

    return (
      <AccordionPane key="legends" title={translate('panes.legends_and_flyouts.subheaders.legends.title')}>
        <div className="authoring-field checkbox">
          <input id="show-legends" type="checkbox" onChange={onChangeShowLegend} defaultChecked={showLegend} />
          <label className="inline-label" htmlFor="show-legends">
            <span className="fake-checkbox">
              <span className="icon-checkmark3"></span>
            </span>
            {translate('panes.legends_and_flyouts.fields.show_legends.title')}
          </label>
        </div>
      </AccordionPane>
    );
  },

  renderRegionMapControls() {
    return this.renderUnits();
  },

  renderBarChartControls() {
    return this.renderUnits();
  },

  renderColumnChartControls() {
    return [this.renderUnits(), this.renderLegends()];
  },

  renderPieChartControls() {
    return this.renderUnits();
  },

  renderHistogramControls() {
    return this.renderUnits();
  },

  renderTimelineChartControls() {
    return this.renderUnits();
  },

  renderFeatureMapControls() {
    const { onSelectRowInspectorTitle, vifAuthoring, metadata } = this.props;
    const rowInspectorTitleColumnName = getRowInspectorTitleColumnName(vifAuthoring);
    const columnAttributes = {
      id: 'flyout-title-column',
      placeholder: translate('panes.legends_and_flyouts.fields.row_inspector_title.no_value'),
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
      <AccordionPane key="rowInspector" title={translate('panes.legends_and_flyouts.subheaders.row_inspector_title')}>
        <div className="authoring-field">
          <label className="block-label" htmlFor="flyout-title-column">Column</label>
          <div className="flyout-title-dropdown-container">
            <Styleguide.Dropdown {...columnAttributes} />
          </div>
        </div>
      </AccordionPane>
    );

    return [this.renderUnits(), rowInspector];
  },

  renderRowInspectorTitleColumnOption(option) {
    const columnType = _.find(COLUMN_TYPES, {type: option.type});
    const icon = columnType ? columnType.icon : '';

    return (
      <div className="dataset-column-selector-option">
        <span className={icon}></span> {option.title}
      </div>
    );
  },

  renderEmptyPane() {
    return <EmptyPane />;
  },

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
      } else if (isColumnChart(vifAuthoring)) {
        configuration = this.renderColumnChartControls();
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
          <Accordion>
            {configuration}
          </Accordion>
        </form>
      );
    } else {
      return null;
    }
  }
});

function mapStateToProps(state) {
  return {
    vifAuthoring: state.vifAuthoring,
    metadata: state.metadata
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onChangeUnitOne: (event) => {
      dispatch(setUnitsOne(event.target.value));
    },

    onChangeUnitOther: (event) => {
      dispatch(setUnitsOther(event.target.value));
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
