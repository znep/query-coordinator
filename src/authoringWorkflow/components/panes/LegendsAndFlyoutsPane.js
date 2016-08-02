import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import styleguide from 'socrata-styleguide';

import { translate } from '../../../I18n';
import { COLUMN_TYPES, INPUT_DEBOUNCE_MILLISECONDS } from '../../constants';
import { getDisplayableColumns, hasData } from '../../selectors/metadata';
import {
  getRowInspectorTitleColumnName,
  getUnitOne,
  getUnitOther,
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

export var LegendsAndFlyoutsPane = React.createClass({
  propTypes: {
    onChangeUnitOne: React.PropTypes.func,
    onChangeUnitOther: React.PropTypes.func,
    vifAuthoring: React.PropTypes.object
  },

  renderUnits() {
    var unitOne = getUnitOne(this.props.vifAuthoring);
    var unitOneAttributes = {
      id: 'units-one',
      className: 'text-input',
      type: 'text',
      onChange: this.props.onChangeUnitOne,
      placeholder: translate('panes.legends_and_flyouts.fields.units_one.placeholder'),
      defaultValue: unitOne
    };

    var unitOther = getUnitOther(this.props.vifAuthoring);
    var unitOtherAttributes = {
      id: 'units-other',
      className: 'text-input',
      type: 'text',
      onChange: this.props.onChangeUnitOther,
      placeholder: translate('panes.legends_and_flyouts.fields.units_other.placeholder'),
      defaultValue: unitOther
    };

    return (
      <div className="authoring-field-group">
        <h5>{translate('panes.legends_and_flyouts.subheaders.units.title')}</h5>
        <p className="authoring-field-description">
          <small>{translate('panes.legends_and_flyouts.subheaders.units.description')}</small>
        </p>
        <div className="authoring-field">
          <label className="block-label" htmlFor="units-one">{translate('panes.legends_and_flyouts.fields.units_one.title')}</label>
          <input {...unitOneAttributes} />
        </div>
        <div className="authoring-field">
          <label className="block-label" htmlFor="units-other">{translate('panes.legends_and_flyouts.fields.units_other.title')}</label>
          <input {...unitOtherAttributes} />
        </div>
      </div>
    );
  },

  renderRegionMapControls() {
    return this.renderUnits();
  },

  renderColumnChartControls() {
    return this.renderUnits();
  },

  renderHistogramControls() {
    return this.renderUnits();
  },

  renderTimelineChartControls() {
    return this.renderUnits();
  },

  renderFeatureMapControls() {
    var { onSelectRowInspectorTitle, vifAuthoring, metadata } = this.props;
    var rowInspectorTitleColumnName = getRowInspectorTitleColumnName(vifAuthoring);
    var columnAttributes = {
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

    return (
      <div>
        {this.renderUnits()}
        <div className="authoring-field-group">
          <h5>{translate('panes.legends_and_flyouts.subheaders.row_inspector_title')}</h5>
          <div className="authoring-field">
            <label className="block-label" htmlFor="flyout-title-column">Column</label>
            <div className="flyout-title-dropdown-container">
              <styleguide.components.Dropdown {...columnAttributes} />
            </div>
          </div>
        </div>
      </div>
    );
  },

  renderRowInspectorTitleColumnOption(option) {
    var columnType = _.find(COLUMN_TYPES, {type: option.type});
    var icon = columnType ? columnType.icon : '';

    return (
      <div className="dataset-column-dropdown-option">
        <span className={icon}></span> {option.title}
      </div>
    );
  },

  renderEmptyPane() {
    return <EmptyPane />;
  },

  render() {
    var { metadata, vifAuthoring } = this.props;
    var configuration;

    if (hasData(metadata)) {
      if (isRegionMap(vifAuthoring)) {
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
          {configuration}
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
    onChangeUnitOne: _.debounce(event => {
      var one = event.target.value;
      dispatch(setUnitsOne(one));
    }, INPUT_DEBOUNCE_MILLISECONDS),

    onChangeUnitOther: _.debounce(event => {
      var other = event.target.value;
      dispatch(setUnitsOther(other));
    }, INPUT_DEBOUNCE_MILLISECONDS),

    onSelectRowInspectorTitle: flyoutTitle => {
      var columnName = flyoutTitle.value;
      dispatch(setRowInspectorTitleColumnName(columnName));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(LegendsAndFlyoutsPane);
