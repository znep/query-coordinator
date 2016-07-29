import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import styleguide from 'socrata-styleguide';

import { translate } from '../../../I18n';
import { COLUMN_TYPES, INPUT_DEBOUNCE_MILLISECONDS } from '../../constants';
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
import { setUnitsOne, setUnitsOther, setRowInspectorTitleColumnName } from '../../actions';
import CustomizationTabPane from '../CustomizationTabPane';

export var LegendsAndFlyoutsPane = React.createClass({
  propTypes: {
    onChangeUnitsOne: React.PropTypes.func,
    onChangeUnitsOther: React.PropTypes.func,
    vifAuthoring: React.PropTypes.object
  },

  units() {
    var unitOne = getUnitOne(this.props.vifAuthoring);
    var unitOneAttributes = {
      id: 'units-one',
      className: 'text-input',
      type: 'text',
      onChange: this.props.onChangeUnitsOne,
      placeholder: translate('panes.legends_and_flyouts.fields.units_one.placeholder'),
      defaultValue: unitOne
    };

    var unitOther = getUnitOther(this.props.vifAuthoring);
    var unitOtherAttributes = {
      id: 'units-other',
      className: 'text-input',
      type: 'text',
      onChange: this.props.onChangeUnitsOther,
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

  regionMap() {
    return this.units();
  },

  columnChart() {
    return this.units();
  },

  histogram() {
    return this.units();
  },

  timelineChart() {
    return this.units();
  },

  renderFlyoutTitleColumnOption(option) {
    var columnType = _.find(COLUMN_TYPES, {type: option.type});
    var icon = columnType ? columnType.icon : '';

    return (
      <div className="dataset-column-dropdown-option">
        <span className={icon}></span> {option.title}
      </div>
    );
  },

  featureMap() {
    var { onSelectFlyoutTitle, vifAuthoring, metadata } = this.props;
    var defaultFlyoutTitleColumn = getRowInspectorTitleColumnName(vifAuthoring);
    // We don't want to allow system columns as the title for row inspector pages
    // since they don't have human-readable names.
    var nonSystemColumns = _.get(metadata, 'data.columns', []).
      filter((column) => (column.fieldName.charAt(0) !== ':'));

    var columnAttributes = {
      id: 'flyout-title-column',
      placeholder: translate('panes.legends_and_flyouts.fields.row_inspector_title.no_value'),
      options: _.map(nonSystemColumns, column => ({
        title: column.name,
        value: column.fieldName,
        type: column.renderTypeName,
        render: this.renderFlyoutTitleColumnOption
      })),
      onSelection: onSelectFlyoutTitle
    };

    return (
      <div>
        {this.units()}
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

  render() {
    var configuration;
    var vifAuthoring = this.props.vifAuthoring;

    if (isRegionMap(vifAuthoring)) {
      configuration = this.regionMap();
    } else if (isColumnChart(vifAuthoring)) {
      configuration = this.columnChart();
    } else if (isHistogram(vifAuthoring)) {
      configuration = this.histogram();
    } else if (isFeatureMap(vifAuthoring)) {
      configuration = this.featureMap();
    } else if (isTimelineChart(vifAuthoring)) {
      configuration = this.timelineChart();
    }

    return (
      <form>
        {configuration}
      </form>
    );
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
    onChangeUnitsOne: _.debounce(event => {
      var one = event.target.value;
      dispatch(setUnitsOne(one));
    }, INPUT_DEBOUNCE_MILLISECONDS),

    onChangeUnitsOther: _.debounce(event => {
      var other = event.target.value;
      dispatch(setUnitsOther(other));
    }, INPUT_DEBOUNCE_MILLISECONDS),

    onSelectFlyoutTitle: flyoutTitle => {
      var columnName = flyoutTitle.value;
      dispatch(setRowInspectorTitleColumnName(columnName));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(LegendsAndFlyoutsPane);
