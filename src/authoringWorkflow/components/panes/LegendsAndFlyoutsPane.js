import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import Styleguide from 'socrata-components';

import { translate } from '../../../I18n';
import { onDebouncedEvent } from '../../helpers';
import { COLUMN_TYPES } from '../../constants';
import { getDisplayableColumns, hasData } from '../../selectors/metadata';
import {
  getRowInspectorTitleColumnName,
  getUnitOne,
  getUnitOther,
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
  setUnitsOne,
  setUnitsOther
} from '../../actions';

import CustomizationTabPane from '../CustomizationTabPane';
import EmptyPane from './EmptyPane';
import Accordion from '../shared/Accordion';
import AccordionPane from '../shared/AccordionPane';

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
      onChange: onDebouncedEvent(this, onChangeUnitOne),
      placeholder: translate('panes.legends_and_flyouts.fields.units_one.placeholder'),
      defaultValue: unitOne
    };

    const unitOther = getUnitOther(vifAuthoring);
    const unitOtherAttributes = {
      id: 'units-other',
      className: 'text-input',
      type: 'text',
      onChange: onDebouncedEvent(this, onChangeUnitOther),
      placeholder: translate('panes.legends_and_flyouts.fields.units_other.placeholder'),
      defaultValue: unitOther
    };

    return (
      <AccordionPane key="units" title={translate('panes.legends_and_flyouts.subheaders.units.title')}>
        <p className="authoring-field-description">
          <small>{translate('panes.legends_and_flyouts.subheaders.units.description')}</small>
        </p>
        <div className="authoring-field">
          <label className="block-label"
                 htmlFor="units-one">{translate('panes.legends_and_flyouts.fields.units_one.title')}</label>
          <input {...unitOneAttributes} />
        </div>
        <div className="authoring-field">
          <label className="block-label"
                 htmlFor="units-other">{translate('panes.legends_and_flyouts.fields.units_other.title')}</label>
          <input {...unitOtherAttributes} />
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
    return this.renderUnits();
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
    onChangeUnitOne: (one) => {
      dispatch(setUnitsOne(one));
    },

    onChangeUnitOther: (other) => {
      dispatch(setUnitsOther(other));
    },

    onSelectRowInspectorTitle: flyoutTitle => {
      const columnName = flyoutTitle.value;
      dispatch(setRowInspectorTitleColumnName(columnName));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(LegendsAndFlyoutsPane);
