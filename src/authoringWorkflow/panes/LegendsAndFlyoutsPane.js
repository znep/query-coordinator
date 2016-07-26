import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import styleguide from 'socrata-styleguide';

import { translate } from '../I18n';
import { INPUT_DEBOUNCE_MILLISECONDS } from '../constants';
import {
  getFlyoutTitleColumn,
  getUnitOne,
  getUnitOther,
  isChoroplethMap,
  isColumnChart,
  isFeatureMap,
  isHistogram,
  isTimelineChart
} from '../selectors/vifAuthoring';
import { setUnitsOne, setUnitsOther, setFlyoutTitle } from '../actions';
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
      <div>
        <h5>{translate('panes.legends_and_flyouts.subheaders.units')}</h5>
        <label className="block-label" htmlFor="units-one">{translate('panes.legends_and_flyouts.fields.units_one.title')}:</label>
        <input {...unitOneAttributes} />
        <label className="block-label" htmlFor="units-other">{translate('panes.legends_and_flyouts.fields.units_other.title')}:</label>
        <input {...unitOtherAttributes} />
      </div>
    );
  },

  choroplethMap() {
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

  featureMap() {
    var { onSelectFlyoutTitle, vifAuthoring, metadata } = this.props;
    var defaultFlyoutTitleColumn = getFlyoutTitleColumn(vifAuthoring);
    var columns = _.get(metadata, 'data.columns', []);
    var columnOptions = [
      ..._.map(columns, column => {
        return <option key={column.fieldName} value={column.fieldName}>{column.name}</option>;
      })
    ];

    var columnAttributes = {
      id: 'flyout-title-column',
      placeholder: translate('panes.legends_and_flyouts.fields.flyout_title.no_value'),
      options: _.map(columns, column => ({title: column.name, value: column.fieldName})),
      onSelection: onSelectFlyoutTitle
    };

    return (
      <div>
        {this.units()}
        <h5>{translate('panes.legends_and_flyouts.subheaders.flyout_title')}</h5>
        <label className="block-label" htmlFor="flyout-title-column">Column</label>
        <div className="flyout-title-dropdown-container">
          <styleguide.components.Dropdown {...columnAttributes} />
        </div>
      </div>
    );
  },

  render() {
    var configuration;
    var vifAuthoring = this.props.vifAuthoring;

    if (isChoroplethMap(vifAuthoring)) {
      configuration = this.choroplethMap();
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
      dispatch(setFlyoutTitle(columnName));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(LegendsAndFlyoutsPane);
